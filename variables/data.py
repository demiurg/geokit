import django.db
import numpy
import xmlrpclib

from datetime import datetime
from pandas.io.sql import read_sql_query, DataFrame
from psycopg2.extras import DateRange
from django.conf import settings

from geokit_tables.models import GeoKitTable
from layers.models import Layer

RPC_CONNECTION = None


def rpc_con():
    global RPC_CONNECTION
    if RPC_CONNECTION is None:
        RPC_CONNECTION = xmlrpclib.ServerProxy(
            settings.RPC_URL, use_datetime=True
        )
    return RPC_CONNECTION


def new_rpc_con():
    return xmlrpclib.ServerProxy(
        settings.RPC_URL, use_datetime=True
    )


def treeToNode(tree):
    return NODE_TYPES[tree[0]](tree[0], tree[1])


def wrapJoins(tree, parent=None):
    if tree[0] == 'join' and parent != 'select':
        join_node = treeToNode(tree)
        field_name = None

        if len(join_node.get_layers()) != 0:
            first_layer = Layer.objects.get(pk=list(join_node.get_layers())[0])
            field_name = first_layer.field_names[0]
        else:
            first_table = GeoKitTable.objects.get(pk=list(join_node.get_tables())[0])
            field_name = first_table.field_names[0]

        return ['select', [tree, field_name]]
    elif tree[0] in ['source', 'dfsource', 'raster', 'join', 'select']:
        return tree
    elif tree[0] == 'named':
        return ['named', [tree[1][0], wrapJoins(tree[1][1])]]
    else:
        return [tree[0], [wrapJoins(op) for op in tree[1]]]


def wrapRasters(tree, parent=None):
    if tree[0] == 'raster' and parent != 'select':
        return ['select', [tree, 'mean']]
    elif tree[0] in ['source', 'dfsource', 'raster', 'join', 'select']:
        return tree
    elif tree[0] == 'named':
        return ['named', [tree[1][0], wrapRasters(tree[1][1])]]
    else:
        return [tree[0], [wrapRasters(op) for op in tree[1]]]


class DataNode(object):
    ''' The DataNode object stores information about
        * operation, which is a list defined strings
        * operands, which are either data sources or other operations
    '''

    def __init__(self, operation, operands):
        self.operation = operation
        # Unhashable type: list is thrown here when operands are not put
        # into another level of operands; good: [+, [1, 2]], bad: [+, 1, 2]
        self.operands = [
            treeToNode(args)
            if type(args) in (list, tuple) and args[0] in NODE_TYPES
            else args
            for args in operands
        ]
        self._dimensions = None
        self._dimensions_str = ''
        self.source_layers = None
        self.source_tables = None
        self.source_rasters = None

    def __unicode__(self):
        return "['{}', [{}]".format(
            self.operation, ", ".join(map(unicode, self.operands))
        )

    def get_dimensions(self):
        dimensions = {}
        for o in self.operands:
            try:
                dimensions.update(o.get_dimensions())
            except AttributeError:
                pass
        return dimensions

    @property
    def dimensions(self):
        '''
            Convert dict {'time': True, 'space': True} to a string 'spacetime'
        '''

        if not self._dimensions:
            self._dimensions = self.get_dimensions()
        self._dimensions_str = ''.join(sorted(self._dimensions.keys()))

        return self._dimensions_str

    @dimensions.setter
    def dimensions(self, value):
        if isinstance(value, dict):
            self._dimensions = value
        elif isinstance(value, str):
            self._dimensions = {}
            if 'space' in value:
                self._dimensions['space'] = True
            if 'time' in value:
                self._dimensions['time'] = True

    def execute(self):
        ''' Return instance of self if not implemented, sort of passthrough '''
        return self

    def execute_operands(self):
        rands = [
            o.execute()
            if hasattr(o, 'execute')
            else o
            for o in self.operands
        ]
        # print rands
        return rands

    def get_layers(self):
        def walk_nodes(node):
            if type(node) == DataSource:
                node.execute()
                return set([l['id'] for l in node.layers])
            elif hasattr(node, 'operands'):
                source_layers = set()
                for operand in node.operands:
                    source_layers = source_layers.union(walk_nodes(operand))
                return source_layers
            else:
                return set()

        if self.source_layers is None:
            self.source_layers = walk_nodes(self)

        return self.source_layers

    def get_tables(self):
        def walk_nodes(node):
            if type(node) == DataSource:
                node.execute()
                return set([t['id'] for t in node.tables])
            elif hasattr(node, 'operands'):
                source_tables = set()
                for operand in node.operands:
                    source_tables = source_tables.union(walk_nodes(operand))
                return source_tables
            else:
                return set()

        if self.source_tables is None:
            self.source_tables = walk_nodes(self)

        return self.source_tables

    def get_rasters(self):
        def walk_nodes(node):
            if type(node) == RasterSource:
                return set([node])
            elif hasattr(node, 'operands'):
                rasters = set()
                for operand in node.operands:
                    rasters = rasters.union(walk_nodes(operand))
                return rasters
            else:
                return set()

        if self.source_rasters is None:
            self.source_rasters = walk_nodes(self)

        return self.source_rasters


def getattrOperator(method):
    class O(DataNode):
        def execute(self):
            left, right = self.execute_operands()
            return getattr(left, method)(right)
    return O


class MeanOperator(DataNode):
    def execute(self):
        vals = self.execute_operands()
        return sum(vals) / len(vals)


class SpatialMeanOperator(DataNode):
    def execute(self):
        val, = self.execute_operands()

        if self.operands[0].dimensions == 'spacetime':
            return val.mean(axis=0)
        elif self.operands[0].dimensions == 'space':
            return val.mean()
        else:
            raise ValueError("No space dimension to aggregate")

    def get_dimensions(self):
        dimensions = super(SpatialMeanOperator, self).get_dimensions()

        if 'space' in dimensions:
            del dimensions['space']

        return dimensions


class TemporalMeanOperator(DataNode):
    def execute(self):
        val, = self.execute_operands()

        if self.operands[0].dimensions == 'spacetime':
            return val.mean(axis=1)
        elif self.operands[0].dimensions == 'time':
            return val.mean()
        else:
            raise ValueError("No time dimension to aggregate")

    def get_dimensions(self):
        dimensions = super(TemporalMeanOperator, self).get_dimensions()

        if 'time' in dimensions:
            del dimensions['time']

        return dimensions


class SpatialFilterOperator(DataNode):
    def execute(self):
        val, filter_ = self.execute_operands()
        '''
        Filter format:
        `{
            'containing_geometries': [],
            'filter_type': 'inclusive'
        }`
        '''
        indices_to_delete = set()
        for i, feature in enumerate(val['spatial_key']):
            contains = False
            for geometry in filter_['containing_geometries']:
                if geometry.contains(feature.geometry):
                    contains = True
                    break

            if filter_['filter_type'] == 'inclusive' and not contains:
                indices_to_delete.add(i)
            elif filter_['filter_type'] == 'exclusive' and contains:
                indices_to_delete.add(i)
        values = numpy.delete(val['values'], list(indices_to_delete), 0)
        spatial_key = numpy.delete(val['spatial_key'], list(indices_to_delete))
        return {
            'values': values,
            'spatial_key': spatial_key,
            'temporal_key': val['spatial_key']
        }


class TemporalFilterOperator(DataNode):
    def execute(self):
        val, filter_ = self.execute_operands()
        '''
        Filter format:
        `{
            'date_ranges': [{'start': '2010-01-01', 'end': '2005-05-30'}, {...}],
            'filter_type': 'inclusive'
        }`
        '''

        ranges = map(
            lambda dr: DateRange(
                datetime.strptime(dr['start'], '%Y-%m-%d').date(),
                datetime.strptime(dr['end'], '%Y-%m-%d').date(),
                bounds=dr.get('bounds', '[]')
            ),
            filter_['date_ranges']
        )

        cols = map(
            lambda c: (
                bool(filter_['filter_type'] == 'inclusive') ==
                # bool() == bool(), xor exclusive inverts the result
                bool(any(c.lower in r or r.lower in c for r in ranges))
                # any is lazy, using lower assumes bounds always start closed
                # TODO: Improve bounds comparison to allow half open start
            ),
            val.columns
        )
        return val.iloc[:, cols]

        raise ValueError('Invalid filter type {}'.format(filter_['filter_type']))


class ValueFilterOperator(DataNode):
    def execute(self):
        val, filter_ = self.execute_operands()
        '''
        Filter format:
        `{
            'comparison': '<',
            'comparator': 5
        }`
        '''

        if filter_['comparison'] == '<':
            return val.where(val < filter_['comparator'])
        elif filter_['comparison'] == '<=':
            return val.where(val <= filter_['comparator'])
        elif filter_['comparison'] == '==':
            return val.where(val == filter_['comparator'])
        elif filter_['comparison'] == '>=':
            return val.where(val >= filter_['comparator'])
        elif filter_['comparison'] == '>':
            return val.where(val > filter_['comparator'])

        # Should not be ere
        raise ValueError("Invalid comparator {}".format(filter_['comparator']))


class SelectOperator(DataNode):
    def execute(self):
        source, field = self.execute_operands()
        stype = type(source)
        if stype is DataSource:
            return self.execute_sql(source, field)
        elif stype is DataFrame:
            return self.execute_dataframe(source, field)
        else:
            raise Exception("SelectOperator invalid operand: {}".format(stype))

    def execute_sql(self, source, field):

        layer_field = ""
        table_field = ""
        if type(field) == dict:
            name = field['field']
            if field['type'] == 'Layer':
                layer_field = ', "{}"'.format(name)
            elif field['type'] == 'Table':
                table_field = ', "{}"'.format(name)
        elif type(field) in (str, unicode):
            name = field
            table_field = ', "{}"'.format(name)
        else:
            raise Exception("Wrong field type: {}".format(type(field)))

        selects = []
        froms = []
        joins = []

        if source.layers:
            selects.append("shaid {}".format(layer_field))

            f_wheres = []
            for layer in source.layers:
                f_wheres.append("layer_id = '{}'".format(layer['id']))

            froms.append(
                "(SELECT properties->'shaid' as shaid, properties->'{0}' as joiner {3} "
                "FROM {1}.layers_feature "
                "WHERE {2!s}) f".format(
                    layer['field'],
                    django.db.connection.schema_name,
                    " AND ".join(f_wheres),
                    ", properties->'"+name+"' as \""+name+"\"" if layer_field else "",
                )
            )

            joins.append('f')

        if source.tables:
            selects.append('date_range {}'.format(table_field))

            t_wheres = []
            for table in source.tables:
                t_wheres.append("table_id = '{}'".format(table['id']))

            froms.append(
                "(SELECT date_range,"
                " properties->'{0}' as joiner, properties->'{1}' as \"{1}\" "
                "FROM {2!s}.geokit_tables_record "
                "WHERE {3}) r".format(
                    table['field'],
                    name,
                    django.db.connection.schema_name,
                    " AND ".join(t_wheres),
                )
            )

            joins.append('r')

        joins = [
            '{}.joiner = {}.joiner'.format(a, b) for a in joins for b in joins if a != b
        ]

        query = "SELECT {} FROM {} WHERE {}".format(
            ", ".join(selects),
            ", ".join(froms),
            " AND ".join(joins) if any(joins) else '1=1'
        )

        cursor = django.db.connection.cursor()
        cursor.execute(query)

        try:
            df = read_sql_query(query, django.db.connection)
            return df.pivot(
                index='shaid', columns='date_range', values=name
            )
        except KeyError as e:
            try:
                df = read_sql_query(
                    query, django.db.connection, index_col='date_range'
                )
            except Exception as e:
                df = read_sql_query(
                    query, django.db.connection
                )
                return df.set_index('shaid')
            return df

    def execute_dataframe(self, results, field):
        df = results.pivot(
            index='shaid', columns='date_range', values=field['field']
        )

        return df


class DataSource(DataNode):
    def get_dimensions(self):
        dimensions = {}
        for source in self.operands:
            if isinstance(source, DataSource):
                dimensions.update(source.get_dimensions())
            elif ('type' in source and source['type'] == 'Layer'):
                dimensions['space'] = True
            elif ('type' in source and source['type'] == 'Table'):
                dimensions['time'] = True
            else:
                raise ValueError("Invalid data source type")
        return dimensions

    def execute(self):
        self.layers = []
        self.tables = []
        self.fields = []

        sources = self.execute_operands()

        for source in sources:
            if isinstance(source, DataSource):
                if 'space' in source.dimensions:
                    self.layers += source.layers
                if 'time' in source.dimensions:
                    self.tables += source.tables
            elif ('type' in source and source['type'] == 'Layer'):
                # to check if exists
                if 'id' in source:
                    Layer.objects.get(id=int(source['id']))
                elif 'name' in source:
                    layer = Layer.objects.get(name=source['name'])
                    source['id'] = layer.id
                else:
                    raise KeyError("Source layer needs id or name")
                self.layers.append(source)
            elif ('type' in source and source['type'] == 'Table'):
                # to check if exists
                if 'id' in source:
                    GeoKitTable.objects.get(id=int(source['id']))
                elif 'name' in source:
                    table = GeoKitTable.objects.get(name=source['name'])
                    source['id'] = table.id
                else:
                    raise KeyError("Source table needs id or name")
                self.tables.append(source)
            else:
                raise ValueError("Invalid data source type")

        return self


class JobIncompleteException(Exception):
    pass


class RasterSource(DataNode):
    ''' Used for testing '''

    def __init__(self, *args, **kwargs):
        super(RasterSource, self).__init__(*args, **kwargs)
        self.raster, self.vector, self.dates = self.operands

    def __str__(self):
        return self.raster['name'] +  ' ' + self.raster['id'] + ' ' + self.dates

    def get_dimensions(self):
        return {'space': True, 'time': True}

    def get_string(self):
        return self.__str__()

    def get_layer(self):
        if type(self.vector) is int:
            layer = self.vector
        else:
            layer = self.vector.get_layers().pop()

        return layer

    def execute(self):
        conn = new_rpc_con()
        from variables.models import RasterRequest

        job_request = RasterRequest.objects.get(
            raster_id=self.raster['id'],
            dates=self.dates,
            vector=self.get_layer()
        )
        job_id = job_request.job_id

        # print job_id

        results = conn.get_results(job_id)
        if not results:
            raise JobIncompleteException()
        print "requesting job {}".format(job_id)
        for r in results:
            date = r['date'].date()
            r['date_range'] = DateRange(date, date, '[]')
            # r['shaid'] = r['shaid']

        df = DataFrame(data=results)
        # df = df.set_index('shaid')
        return df

    def __unicode__(self):
        return "[raster, [{}]".format(
            self.operation, ", ".join(map(str, self.operands))
        )


class DataFrameSource(DataNode):
    ''' Used for testing '''

    def get_dimensions(self):
        return {
            'space': 'space' in self.operands[1],
            'time': 'time' in self.operands[1]
        }

    def execute(self):
        return self.operands[0]


class NamedNode(DataNode):
    def execute(self):
        return self.operands[1].execute()

    def name(self):
        return self.operands[0]


NODE_TYPES = {
    '+': getattrOperator('__add__'),
    '-': getattrOperator('__sub__'),
    '*': getattrOperator('__mul__'),
    '/': getattrOperator('__div__'),

    'mean': MeanOperator,
    'smean': SpatialMeanOperator,
    'tmean': TemporalMeanOperator,

    'filter': ValueFilterOperator,
    'sfilter': SpatialFilterOperator,
    'tfilter': TemporalFilterOperator,

    'source': DataSource,
    'dfsource': DataFrameSource,
    'raster': RasterSource,
    'join': DataSource,
    'select': SelectOperator,

    'named': NamedNode,
}

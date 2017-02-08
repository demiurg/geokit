import django.db
import pandas
import numpy
import json
from datetime import datetime
from pandas.io.sql import read_sql
from psycopg2.extras import DateRange

from geokit_tables.models import GeoKitTable
from layers.models import Layer


def treeToNode(tree):
    return NODE_TYPES[tree[0]](tree[0], tree[1])


class DataNode(object):
    def __init__(self, operation, operands):
        self.operation = operation
        self.operands = [
            treeToNode(args)
            if type(args) in (list, tuple) and args[0] in NODE_TYPES
            else args
            for args in operands
        ]

    def __unicode__(self):
        return self.operation

    def execute_operands(self):
        rands = [
            o.execute()
            if hasattr(o, 'execute')
            else o
            for o in self.operands
        ]
        #print rands
        return rands


def getattrOperator(method):
    class O(DataNode):
        def execute(self):
            left, right = self.execute_operands()
            return getattr(left, method)(right)
    return O


class MeanOperator(DataNode):
    def execute(self):
        return sum(self.operands) / len(self.operands)


class SpatialMeanOperator(DataNode):
    def execute(self):
        val, = self.execute_operands()

        if type(val) == pandas.DataFrame:
            return val.mean(axis=0)
        elif type(val) == pandas.Series:
            if self.data_dimension(val) == 'space':
                return val.mean()
            else:
                raise ValueError("No space dimension to aggregate")


class TemporalMeanOperator(DataNode):
    def execute(self):
        val, = self.execute_operands()

        if type(val) == pandas.DataFrame:
            return val.mean(axis=1)
        elif type(val) == pandas.Series:
            if self.data_dimensions(val) == 'time':
                return val.mean()
            else:
                raise ValueError("No time dimension to aggregate")


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
        source, name = self.execute_operands()
        '''
        Serialization format:
        `{
            'model': 'Table',
            'id': 1,
            'field': 'fid'
        }`
        '''

        source.select(name)
        return source.variable()


class JoinOperator(DataNode):
    def execute(self):
        left, right = self.execute_operands()
        return DataSource(left, right)


class DataSource(object):
    '''
        For now only implement table and layer joining
        TODO: Allow joins and selects of any tables/layers combos
    '''

    def __init__(self, *sources):
        self.layers = []
        self.tables = []
        self.fields = []

        for source in sources:
            if ('type' in source and source['type'] == 'Layer'):
                # to check if exists
                if 'id' in source:
                    Layer.objects.get(id=int(source['id']))
                elif 'name' in source:
                    Layer.objects.get(name=source['name'])
                else:
                    raise KeyError("Source layer needs id or name")

                self.layers.append(source)
            elif ('type' in source and source['type'] == 'Table'):
                # to check if exists
                if 'id' in source:
                    GeoKitTable.objects.get(id=int(source['id']))
                elif 'name' in source:
                    GeoKitTable.objects.get(name=source['name'])
                else:
                    raise KeyError("Source table needs id or name")

                self.tables.append(source)
            else:
                raise ValueError("Invalid data source type")

    def select(self, field):
        if type(field) == dict:
            name = field['field']
        elif type(field) in (str, unicode):
            name = field
        else:
            raise Exception("Wrong field type: {}".format(type(field)))
        self.name = name

        selects = []
        froms = []
        joins = []

        if self.layers:
            selects.append("feature_id")

            f_wheres = []
            for layer in self.layers:
                f_wheres.append("layer_id = '{}'".format(layer['id']))

            froms.append(
                "(SELECT id as feature_id, properties->'{0}' as joiner "
                "FROM {1}.layers_feature "
                "WHERE {2!s}) f".format(
                    layer['field'],
                    django.db.connection.schema_name,
                    " AND ".join(f_wheres),
                )
            )

            joins.append('f')

        if self.tables:
            selects.append('date_range, "{}"'.format(name))

            t_wheres = []
            for table in self.tables:
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
            '{}.joiner = {}.joiner'.format(a, b) for a in joins for b in joins
        ]

        self.query = "SELECT {} FROM {} WHERE {}".format(
            ", ".join(selects),
            ", ".join(froms),
            " AND ".join(joins)
        )

        return self.query

    def variable(self):
        cursor = django.db.connection.cursor()
        cursor.execute(self.query)

        try:
            self.df = read_sql(self.query, django.db.connection)
            return self.df.pivot(
                index='feature_id', columns='date_range', values=self.name
            )
        except KeyError as e:
            #print e
            self.df = read_sql(
                self.query, django.db.connection, index_col='date_range'
            )
            return self.df

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

    'join': JoinOperator,
    'select': SelectOperator,
}

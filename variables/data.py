import django.db
from pandas.io.sql import read_sql

from geokit_tables.models import GeoKitTable
from layers.models import Layer


class DataSource(object):
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

        if self.layers:
            selects.append("feature_id")

            f_wheres = []
            for layer in self.layers:
                f_wheres.append("layer_id = '{}'".format(layer['id']))

            froms.append(
                "(SELECT id as feature_id,  properties->'{0}' as joiner "
                "FROM {1}.layers_feature "
                "WHERE {2!s}) f".format(
                    layer['field'],
                    django.db.connection.schema_name,
                    " AND ".join(f_wheres),
                )
            )

        if self.tables:
            selects.append('record_id, date_range, "{}"'.format(name))

            r_wheres = []
            for table in self.tables:
                r_wheres.append("table_id = '{}'".format(table['id']))

            froms.append(
                "(SELECT id as record_id, date_range,"
                " properties->'{0}' as joiner, properties->'{1}' as \"{1}\" "
                "FROM {2!s}.geokit_tables_record "
                "WHERE {3}) r".format(
                    table['field'],
                    name,
                    django.db.connection.schema_name,
                    " AND ".join(r_wheres),
                )
            )

        query = "SELECT {} FROM {} WHERE f.joiner = r.joiner".format(
            ", ".join(selects),
            ", ".join(froms),
        )

        cursor = django.db.connection.cursor()
        cursor.execute(query)

        self.df = read_sql(query, django.db.connection)

        return self.df

    def variable(self):
        return self.df.pivot(
            index='feature_id', columns='date_range', values=self.name
        )

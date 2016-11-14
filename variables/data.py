import numpy as np
import sympy
from sortedcontainers import SortedDict, SortedSet

import django.db
from pandas.io import sql
from pandas.io.sql import read_sql


class DataSource(object):
    def __init__(self, *sources):
        self.layers = []
        self.tables = []
        self.fields = []

        for source in sources:
            if ('model' in source and source['model'] == 'Layer') or \
               ('type' in source and source['type'] == 'Layer'):
                self.layers.append(source)
            elif ('model' in source and source['model'] == 'Table') or \
               ('type' in source and source['type'] == 'Table'):
                self.tables.append(source)

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
                "(SELECT id as feature_id,  properties->>'{0}' as joiner "
                "FROM {1}.layers_feature "
                "WHERE {2!s}) f".format(
                    layer['field'],
                    django.db.connection.schema_name,
                    "AND".join(f_wheres),
                )
            )

        if self.tables:
            selects.append("record_id, date, {}".format(name))

            r_wheres = []
            for table in self.tables:
                r_wheres.append("table_id = '{}'".format(table['id']))

            froms.append(
                "(SELECT id as record_id, date,"
                " properties->>'{0}' as joiner, properties->>'{1}' as {1} "
                "FROM {2!s}.geokit_tables_record "
                "WHERE {3}) r".format(
                    table['field'],
                    name,
                    django.db.connection.schema_name,
                    "AND".join(r_wheres),
                )
            )

        query = "SELECT {} FROM {} WHERE f.joiner = r.joiner".format(
            ", ".join(selects),
            ", ".join(froms),
        )

        cursor = django.db.connection.cursor()
        cursor.execute(query)

        self.df = read_sql(
            query,
            django.db.connection,
            index_col='date',
            params=None
        )

        return self.df

    def variable(self):

        if self.df.empty:  # did you find any data?
            values, t_key, s_key = [[]], [], []

        s_key = self.df['feature_id'].unique()
        t_key = self.df.index.unique()
        values = self.df.groupby(['feature_id'])[self.name].apply(list)
        # fix to values in future
        values = np.array(values.tolist(), dtype='float64')
        return {
            'values': values,
            'temporal_key': t_key, 'spatial_key': s_key
        }

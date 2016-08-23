import numpy as np
import sympy
from sortedcontainers import SortedDict, SortedSet

import django.db
from pandas.io import sql
from pandas.io.sql import read_frame


class DataSource(object):
    def __init__(self, *sources):
        self.layers = []
        self.tables = []
        self.fields = []

        for source in sources:
            if source['model'] == 'Layer':
                self.layers.append(source)
            elif source['model'] == 'Table':
                self.tables.append(source)

    def select(self, name):
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

        self.df = read_frame(
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


def join_layer_and_table(layer_name, layer_field, table_name, table_field, variable):
    """
    Query returns all rows from respective table records and layer features joined via a column
    in each's `property` field. This returns a result similar to:

      (1, {properties...}, 3, {properties...}, date(2010, 1, 1)),
      (1, {properties...}, 3, {properties...}, date(2010, 1, 2)),
      (2, {properties...}, 3, {properties...}, date(2010, 1, 2)),

    As the results are iterated over, each row is placed into a 2 layer deep dict where the outer
    key is the feature ID, and the inner key is the date.

      {
        1: {date(2010, 1, 1): {properties...}, date(2010, 1, 2): {properties...}},
        2: {date(2010, 1, 1): {properites...}
      }

    The keys of every inner dict are compared to find the common temporal key, and the extra rows
    are discarded. The properties are extracted for the 2 layer dict into a 2D array, and the keys
    from both layers of dicts are used for the spatial and temoporal keys.
    """

    query = """
        SELECT t1.id, t1.properties, t2.id, t2.properties, t2.date FROM """ +\
        django.db.connection.schema_name + """.layers_feature t1
            JOIN """ + django.db.connection.schema_name + """.geokit_tables_record t2
            ON t1.properties->>%s = t2.properties->>%s
            WHERE t1.layer_id = %s AND t2.table_id = %s
    """

    cursor = django.db.connection.cursor()
    cursor.execute(query, [layer_field, table_field, layer_name, table_name])

    # dict of dicts:  outer key is feature IDs, inner key is dates, inner
    # values are geokit_tables.Record.properties.
    results = {}
    for (f_id, _, _, t_props, t_date) in cursor.fetchall():
        if f_id not in results:
            results[f_id] = SortedDict()
        results[f_id][t_date] = t_props[variable]

    if results == {}:  # did you find any data?
        return [[]], [], []

    spatial_key = results.keys()  # list of layers_feature.id

    # find the common set of dates
    temporal_key = results[spatial_key[0]].keys()
    for _, row in results.iteritems():
        temporal_key = SortedSet([date for date in temporal_key if date in row.keys()])

    # result_matrix is just the natural list of lists taken from results,
    # but with the keys removed.
    result_matrix = []
    for _, vals in results.iteritems():
        row = []
        for date, val in vals.iteritems():
            if date in temporal_key:
                row.append(val)
        result_matrix.append(row)

    return result_matrix, list(temporal_key), spatial_key

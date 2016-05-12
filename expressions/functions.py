from django.apps import apps
from django.db import connection

import numpy as np
import sympy
from sortedcontainers import SortedDict

from expressions.helpers import ExpressionResult


class Join(sympy.Function):
    '''
    Currently, this function has the specific signature of
    JOIN(layer__layer_name__field, table__table_name__field).
    This may be expanded later to work with joins of other combinations
    of data.
    '''

    @classmethod
    def eval(cls, layer, table):
        layer_type, layer_name, layer_field = str(layer).split('__')
        table_type, table_name, table_field = str(table).split('__')

        query = """
            SELECT t1.id, t1.properties, t2.id, t2.properties, t2.date FROM """ +\
            connection.schema_name + """.layers_feature t1
                JOIN """ + connection.schema_name + """.geokit_tables_record t2
                ON t1.properties->>%s = t2.properties->>%s
                WHERE t1.layer_id = %s AND t2.table_id = %s
        """
        cursor = connection.cursor()
        cursor.execute(query, [layer_field, table_field, layer_name, table_name])

        results = {}
        for row in cursor.fetchall():
            if row[0] not in results.keys():
                results[row[0]] = SortedDict()
            results[row[0]][row[4]] = row[3]

        spatial_key = results.keys()
        temporal_key = list(results[spatial_key[0]].keys())

        result_matrix = []
        for layer, vals in results.iteritems():
            result_matrix.append(vals.values())

        return ExpressionResult(result_matrix, temporal_key, spatial_key)


class Extract(sympy.Function):
    @classmethod
    def eval(cls, column_name, expression):
        Expression = apps.get_model(app_label='expressions', model_name='Expression')
        matrix = Expression.objects.get(name=str(expression)).evaluate(None)

        result = np.zeros(matrix.vals.shape)

        for i, col in enumerate(matrix.vals):
            for j, row in enumerate(col):
                result[i][j] = row[str(column_name)]

        return ExpressionResult(result, matrix.temporal_key, matrix.spatial_key)


GEOKIT_FUNCTIONS = {
    'JOIN': Join,
    'EXTRACT': Extract,
}

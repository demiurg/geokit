from django.apps import apps

import numpy as np
import sympy

from expressions.helpers import ExpressionResult

from .helpers import join_layer_and_table


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

        result_matrix, temporal_key, spatial_key = join_layer_and_table(layer_name, layer_field, table_name, table_field)

        return ExpressionResult(result_matrix, temporal_key, spatial_key)


class Extract(sympy.Function):
    @classmethod
    def eval(cls, column_name, expression):
        if isinstance(expression, ExpressionResult):
            matrix = expression
        else:
            Expression = apps.get_model(app_label='expressions',
                                        model_name='Expression')
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

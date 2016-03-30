from django.db import connection

from sympy import Function


def type_to_table(type_):
    if type_ == 'table':
        return 'geokit_tables_record', 'table_id'
    elif type_ == 'layer':
        return 'layers_feature', 'layer_id'


class Join(Function):
    @classmethod
    def eval(cls, left, right):
        left_type, left_name, left_field = str(left).split('__')
        right_type, right_name, right_field = str(right).split('__')

        left_table, left_table_relation = type_to_table(left_type)
        right_table, right_table_relation = type_to_table(right_type)

        query = """
            SELECT t1.id, t1.properties, t2.id, t2.properties FROM site1.{0} t1
                JOIN site1.{1} t2
                ON t1.properties->'{2}' = t2.properties->'{3}'
                WHERE t1.{4} = '{5}' AND t2.{6} = '{7}'
        """.format(left_table, right_table, left_field, right_field,
                   left_table_relation, left_name, right_table_relation, right_name)

        cursor = connection.cursor()
        cursor.execute(query)

        return cursor.fetchall()


GEOKIT_FUNCTIONS = {
    'JOIN': Join,
}

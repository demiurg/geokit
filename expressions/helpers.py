import numpy as np
import sympy
from sortedcontainers import SortedDict, SortedSet

import django.db


class ExpressionResult(sympy.Atom):
    """Used for storing a numpy array of values.

    Each row & column can be optionally associated with features and
    datetimes to associate the values with the real world."""
    def __init__(self, vals=None, temporal_key=None, spatial_key=None):
        """Constructor for ExpressionResult class.

        Uses empty arrays as defaults for vals and the keys.  Raises
        sympy.ShapeError if vals' contents aren't all the same length.
        """
        self.vals = np.array([[]] if vals is None else vals)
        if len(self.vals.shape) == 1:  # No consistent row length
            raise sympy.ShapeError("Value must not be a jagged array.")

        # datetime corresponding to each column
        self.temporal_key = [] if temporal_key is None else temporal_key
        # Feature id corresponding to each row
        self.spatial_key = [] if spatial_key is None else spatial_key

    @staticmethod
    def scalar(val):
        """Enclose a single object in an ExpresssionResult."""
        return ExpressionResult([[val]])

    def unpack(self):
        """If only a single value is present, return it.

        Otherwise return all the data."""
        if self.vals.shape == (1, 1):  # Scalar
            return self.vals[0][0]
        else:
            return self.vals

    def dimensions_equal_to(self, other):
        return self.temporal_key == other.temporal_key \
            and self.spatial_key == other.spatial_key

    def __eq__(self, other):
        """ExpressionResults are equal if their data and metadata are equal.

        Note that the parent class provides __ne__."""
        return (isinstance(other, self.__class__)) \
            and np.array_equal(self.vals, other.vals) \
            and self.dimensions_equal_to(other)


def evaluate_over_matrices(expr, variables):
    if len(variables) == 0:
        return [[sympy.simplify(expr)]]

    shape = variables[0][1].vals.shape
    for variable in variables:
        if variable[1].vals.shape != shape:
            raise sympy.ShapeError("All variables must have the same shape.")

    result = np.zeros(shape)

    for i in range(shape[0] * shape[1]):
        variables_at_index = [(var[0], var[1].vals.flat[i]) for var in variables]
        result.flat[i] = sympy.simplify(expr.subs(variables_at_index))

    return result


def compare_to_date(date, comparison, benchmark):
    benchmark['month'] = int(benchmark['month'])
    benchmark['day'] = int(benchmark['day'])

    if comparison == 'et' or comparison == 'ltet' or comparison == 'gtet':
        if benchmark['month'] <= date.lower.month and date.upper.month <= benchmark['month'] and \
           benchmark['day'] <= date.lower.day and date.upper.day <= benchmark['day']:
            return True

    if comparison == 'lt' or comparison == 'ltet':
        if date.lower.month < benchmark['month']:
            return True
        elif date.lower.month == benchmark['month'] and date.lower.day < benchmark['day']:
            return True

    if comparison == 'gt' or comparison == 'gtet':
        if date.upper.month > benchmark['month']:
            return True
        elif date.upper.month == benchmark['month'] and date.upper.day > benchmark['day']:
            return True

    return False

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


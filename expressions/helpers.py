import numpy as np
import sympy


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

    def __eq__(self, other):
        """ExpressionResults are equal if their data and metadata are equal.

        Note that the parent class provides __ne__."""
        return (isinstance(other, self.__class__)) \
            and np.array_equal(self.vals, other.vals) \
            and (self.temporal_key == other.temporal_key) \
            and (self.spatial_key == other.spatial_key)


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

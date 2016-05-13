import numpy as np
import sympy


class ExpressionResult(object):
    def __init__(self, vals=[[]], temporal_key=[], spatial_key=[]):
        self.vals = np.array(vals)
        if len(self.vals.shape) == 1:  # No consitent row length
            raise sympy.ShapeError("Value must not be a jagged array.")

        self.temporal_key = temporal_key  # datetime corresponding to each column
        self.spatial_key = spatial_key    # Feature id corresponding to each row

    @staticmethod
    def scalar(val):
        return ExpressionResult([[val]])

    def unpack(self):
        if self.vals.shape == (1, 1):  # Scalar
            return self.vals[0][0]
        else:
            return self.vals

    def __eq__(self, other):
        return (isinstance(other, self.__class__)) \
            and (self.vals == other.vals) \
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

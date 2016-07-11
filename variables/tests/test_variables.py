import pytest
import numpy as np

from variables.models import Variable


def test_arithmetic_operators_scalar():
    v = Variable(tree=['+', [1, 2]])
    assert v.data() == 3

    v = Variable(tree=['+', [['+', [1, 2]], 3]])
    assert v.data() == 6

    v = Variable(tree=['+', [3, ['+', [1, 2]]]])
    assert v.data() == 6

    v = Variable(tree=['-', [['-', [6, 2]], 1]])
    assert v.data() == 3

    v = Variable(tree=['*', [3, ['*', [1, 3]]]])
    assert v.data() == 9

    v = Variable(tree=['/', [3, 1]])
    assert v.data() == 3


def test_arithmetic_operators_matrices():
    v = Variable(tree=['+',
        [np.array([[1, 2], [3, 4]]), np.array([[2, 3], [4, 5]])]
    ])
    np.testing.assert_array_equal(v.data(), np.array([[3, 5], [7, 9]]))

    v = Variable(tree=['+',
        [np.array([[1, 2], [3, 4]]), 2]
    ])
    np.testing.assert_array_equal(v.data(), np.array([[3, 4], [5, 6]]))

    v = Variable(tree=['+',
        [np.array([[1, 2], [3, 4]]), np.array([[1, 2, 3], [4, 5, 6]])]
    ])
    with pytest.raises(ValueError):
        v.data()


def test_spatial_mean_operator():
    v = Variable(tree=['smean',
        [np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])]
    ])

    np.testing.assert_array_equal(v.data(), np.array([[4, 5, 6]]))


def test_temporal_mean_operator():
    v = Variable(tree=['tmean',
        [np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])]
    ])

    np.testing.assert_array_equal(v.data(), np.array([[2], [5], [8]]))

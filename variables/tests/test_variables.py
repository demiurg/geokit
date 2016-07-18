import pytest
import numpy as np
import numpy.ma as ma

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


@pytest.mark.django_db
def test_join_operator(set_schema):
    v = Variable(tree=['join', [
        {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
        {'model': 'GeoKitTable', 'id': 'cnty24k97_data', 'field': 'fid'},
        'tmin'
    ]])
    np.testing.assert_array_equal(v.data(), np.array([
        [-4.0, -3.5, -2.5, -1.5, 1],
        [8.0, 7.0, 3.5, 5.0, 3.5]
    ]))

    v = Variable(tree=['join', [
        {'model': 'GeoKitTable', 'id': 'cnty24k97_data', 'field': 'fid'},
        {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
        'tmin'
    ]])
    np.testing.assert_array_equal(v.data(), np.array([
        [-4.0, -3.5, -2.5, -1.5, 1],
        [8.0, 7.0, 3.5, 5.0, 3.5]
    ]))

    v = Variable(tree=['join', [
        {'model': 'GeoKitTable', 'id': 1, 'field': 'fid'},
        {'model': 'GeoKitTable', 'id': 2, 'field': 'fid'},
        'test'
    ]])
    with pytest.raises(ValueError):
        v.data()

    v = Variable(tree=['join', [
        {'model': 'Layer', 'id': 1, 'field': 'fid'},
        {'model': 'Layer', 'id': 2, 'field': 'fid'},
        'test'
    ]])
    with pytest.raises(ValueError):
        v.data()


def test_value_filter_operator():
    test_matrix = np.array([[1, 2], [3, 4]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>', 'comparator': 3}
    ]])

    assert not ma.is_masked(v.data()[0][0])
    assert not ma.is_masked(v.data()[0][1])
    assert not ma.is_masked(v.data()[1][0])
    assert ma.is_masked(v.data()[1][1])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>=', 'comparator': 3}
    ]])

    assert not ma.is_masked(v.data()[0][0])
    assert not ma.is_masked(v.data()[0][1])
    assert ma.is_masked(v.data()[1][0])
    assert ma.is_masked(v.data()[1][1])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<', 'comparator': 3}
    ]])

    assert ma.is_masked(v.data()[0][0])
    assert ma.is_masked(v.data()[0][1])
    assert not ma.is_masked(v.data()[1][0])
    assert not ma.is_masked(v.data()[1][1])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<=', 'comparator': 3}
    ]])

    assert ma.is_masked(v.data()[0][0])
    assert ma.is_masked(v.data()[0][1])
    assert ma.is_masked(v.data()[1][0])
    assert not ma.is_masked(v.data()[1][1])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '==', 'comparator': 3}
    ]])

    assert not ma.is_masked(v.data()[0][0])
    assert not ma.is_masked(v.data()[0][1])
    assert ma.is_masked(v.data()[1][0])
    assert not ma.is_masked(v.data()[1][1])

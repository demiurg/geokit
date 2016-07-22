from datetime import date

import pytest
import numpy as np
import numpy.ma as ma

from django.contrib.gis.geos import GEOSGeometry

from layers.models import Feature
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

    np.testing.assert_array_equal(v.data().mask, [[False, False], [False, True]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>=', 'comparator': 3}
    ]])

    np.testing.assert_array_equal(v.data().mask, [[False, False], [True, True]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<', 'comparator': 3}
    ]])

    np.testing.assert_array_equal(v.data().mask, [[True, True], [False, False]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<=', 'comparator': 3}
    ]])

    np.testing.assert_array_equal(v.data().mask, [[True, True], [True, False]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '==', 'comparator': 3}
    ]])

    np.testing.assert_array_equal(v.data().mask, [[False, False], [True, False]])


def test_spatial_filter():
    f1 = Feature()
    f2 = Feature()
    f1.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 12 12, 12 18, 18 18, 18 17, 12 12)))')
    f2.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 1 1, 1 2, 2 2, 2 1, 1 1)))')
    v = Variable(tree=['sfilter', [
        np.array([[1, 2, 3, 4], [5, 6, 7, 8]]),
        {'filter_type': 'inclusive', 'containing_geometries': [
            GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10 )))')
        ]}
    ]], spatial_domain=[f1, f2])

    np.testing.assert_array_equal(v.data().mask, [[False, False, False, False], [True, True, True, True]])


def test_temporal_filter_operator():
    v = Variable(tree=['tfilter', [
        np.array([[1, 2, 3, 4], [5, 6, 7, 8]]),
        {'filter_type': 'inclusive', 'date_ranges': [
            {'start': date(2010, 2, 1), 'end': date(2010, 4, 1)}
        ]}
    ]], temporal_domain=[date(2010, 1, 1), date(2010, 2, 1), date(2010, 3, 1), date(2010, 4, 1)])

    np.testing.assert_array_equal(v.data().mask, [[True, False, False, False], [True, False, False, False]])

from datetime import date
from collections import namedtuple
import pytest
import mock
import numpy as np
import numpy.ma as ma

from django.contrib.gis.geos import GEOSGeometry

from layers.models import Feature
from variables.models import Variable

def _scalar_val(val):
    return {'values': val, 'spatial_key': [], 'temporal_key': []}

spatial_key = [1, 2]
temporal_key = [date(2010, 1, 1), date(2010, 1, 2)]


def test_arithmetic_operators_scalar():
    v = Variable(tree=['+', [_scalar_val(1), _scalar_val(2)]])
    assert v.data()['values'] == 3

    v = Variable(tree=['+', [['+', [_scalar_val(1), _scalar_val(2)]], _scalar_val(3)]])
    assert v.data()['values'] == 6

    v = Variable(tree=['+', [_scalar_val(3), ['+', [_scalar_val(1), _scalar_val(2)]]]])
    assert v.data()['values'] == 6

    v = Variable(tree=['-', [['-', [_scalar_val(6), _scalar_val(2)]], _scalar_val(1)]])
    assert v.data()['values'] == 3

    v = Variable(tree=['*', [_scalar_val(3), ['*', [_scalar_val(1), _scalar_val(3)]]]])
    assert v.data()['values'] == 9

    v = Variable(tree=['/', [_scalar_val(3), _scalar_val(1)]])
    assert v.data()['values'] == 3


def test_arithmetic_operators_matrices():
    v = Variable(tree=['+', [
            {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key},
            {'values': np.array([[2, 3], [4, 5]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key}
    ]])
    np.testing.assert_array_equal(v.data()['values'], np.array([[3, 5], [7, 9]]))

    v = Variable(tree=['+', [
            {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key},
            _scalar_val(2)
    ]])
    np.testing.assert_array_equal(v.data()['values'], np.array([[3, 4], [5, 6]]))

    v = Variable(tree=['+', [
        {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key},
        {'values': np.array([[1, 2, 3], [4, 5, 6]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key.append(date(2010, 1, 3))}
    ]])
    with pytest.raises(ValueError):
        v.data()


def test_mean_operator():
    v = Variable(tree=['mean', [
        {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key},
        {'values': np.array([[5, 6], [7, 8]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key}
    ]])
    np.testing.assert_array_equal(v.data()['values'], np.array([[3, 4], [5, 6]]))

    v = Variable(tree=['mean', [
        {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key},
        {'values': np.array([[1], [2]]), 'spatial_key': [1], 'temporal_key': [date(2010, 1, 1)]},
    ]])
    with pytest.raises(ValueError):
        v.data()


def test_spatial_mean_operator():
    v = Variable(tree=['smean', [
        {'values': np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key}
    ]])

    np.testing.assert_array_equal(v.data()['values'], np.array([[4, 5, 6]]))


def test_temporal_mean_operator():
    v = Variable(tree=['tmean', [
        {'values': np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key}
    ]])

    np.testing.assert_array_equal(v.data()['values'], np.array([[2], [5], [8]]))


@pytest.mark.django_db
def test_select_join_operator(set_schema, monkeypatch):
    mockobj = mock.Mock(side_effect=KeyError('foo'))
    with mock.patch('django.db.connection') as connection:
        connection.schema_name = 'test'
        connection.cursor.return_value.description.__iter__.return_value = (
            ( 'feature_id', 23, None, 4, None, None, None),
            ( 'record_id', 23, None, 4, None, None, None),
            ( 'date', 1082, None, 4, None, None, None),
            ( 'tmin', 25, None, -1, None, None, None)
        )

        connection.cursor.return_value.fetchall.return_value = [
            (1, 1, date(2010, 1, 1), 2),
            (1, 2, date(2010, 1, 2), 5),
            (2, 1, date(2010, 1, 1), 4),
            (2, 2, date(2010, 1, 2), 8),
        ]

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
                    {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
                ]],
                'tmin',
            ]
        ])

        values = v.data()['values']
        np.testing.assert_array_equal(values, np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
                    {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
                ]],
                'tmin'
            ]
        ])
        np.testing.assert_array_equal(v.data()['values'], np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'model': 'Table', 'id': 1, 'field': 'fid'},
                    {'model': 'Table', 'id': 2, 'field': 'fid'},
                ]],
                'test'
            ]
        ])
        with pytest.raises(KeyError):
            v.data()

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'model': 'Layer', 'id': 1, 'field': 'fid'},
                    {'model': 'Layer', 'id': 2, 'field': 'fid'},
                ]],
                'test'
            ]
        ])
        with pytest.raises(KeyError):
            v.data()


@pytest.mark.django_db
def test_join_operator(set_schema, monkeypatch):
    with mock.patch('django.db.connection') as connection:
        connection.schema_name = 'test'
        connection.cursor.return_value.fetchall.return_value = [
            (1, None, None, {'tmin': 2}, date(2010, 1, 1)),
            (1, None, None, {'tmin': 5}, date(2010, 1, 2)),
            (2, None, None, {'tmin': 4}, date(2010, 1, 1)),
            (2, None, None, {'tmin': 8}, date(2010, 1, 2)),
        ]

        v = Variable(tree=['join', [
            {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
            {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
            'tmin'
        ]])

        np.testing.assert_array_equal(v.data()['values'], np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=['join', [
            {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
            {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
            'tmin'
        ]])

        np.testing.assert_array_equal(v.data()['values'], np.array([
            [2, 5], [4, 8]
        ]))

        # THIS JOIN only works between tables and layers

        v = Variable(tree=['join', [
            {'model': 'Table', 'id': 1, 'field': 'fid'},
            {'model': 'Table', 'id': 2, 'field': 'fid'},
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
    test_matrix = {'values': np.array([[1, 2], [3, 4]]), 'spatial_key': spatial_key, 'temporal_key': temporal_key}

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[False, False], [False, True]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>=', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[False, False], [True, True]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[True, True], [False, False]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<=', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[True, True], [True, False]])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '==', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[False, False], [True, False]])

    masked_matrix = {
        'values': ma.array([[1, 2], [3, 4]], mask=[[False, False], [True, False]]),
        'spatial_key': spatial_key,
        'temporal_key': temporal_key
    }
    v = Variable(tree=['filter', [
        masked_matrix, {'comparison': '==', 'comparator': 2}
    ]])
    np.testing.assert_array_equal(v.data()['values'].mask, [[False, True], [True, False]])


def test_spatial_filter():
    f1 = Feature()
    f2 = Feature()
    f1.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 12 12, 12 18, 18 18, 18 17, 12 12)))')
    f2.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 1 1, 1 2, 2 2, 2 1, 1 1)))')

    v = Variable(tree=['sfilter', [
        {'values': np.array([[1, 2, 3, 4], [5, 6, 7, 8]]), 'spatial_key': [f1, f2], 'temporal_key': []},
        {'filter_type': 'inclusive', 'containing_geometries': [
            GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10 )))')
        ]}
    ]])
    np.testing.assert_array_equal(v.data()['values'], [[1, 2, 3, 4]])

    v = Variable(tree=['sfilter', [
        {'values': np.array([[1, 2, 3, 4], [5, 6, 7, 8]]), 'spatial_key': [f1, f2], 'temporal_key': []},
        {'filter_type': 'exclusive', 'containing_geometries': [
            GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10 )))')
        ]}
    ]])
    np.testing.assert_array_equal(v.data()['values'], [[5, 6, 7, 8]])

def test_temporal_filter_operator():
    v = Variable(tree=['tfilter', [
        {
            'values': np.array([[1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8]]),
            'spatial_key': [],
            'temporal_key': [date(2010, 1, 1), date(2010, 2, 1), date(2010, 3, 1), date(2010, 4, 1), date(2010, 5, 1), date(2010, 6, 1), date(2010, 7, 1), date(2010, 8, 1)]
        },
        {'filter_type': 'inclusive', 'date_ranges': [
            {'start': '2010-02-01', 'end': '2010-04-01'},
            {'start': '2010-06-01', 'end': '2010-08-01'},
        ]}
    ]])
    np.testing.assert_array_equal(v.data()['values'], [[2, 3, 4, 6, 7, 8], [2, 3, 4, 6, 7, 8]])

    v = Variable(tree=['tfilter', [
        {
            'values': np.array([[1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 4, 5, 6, 7, 8]]),
            'spatial_key': [],
            'temporal_key': [date(2010, 1, 1), date(2010, 2, 1), date(2010, 3, 1), date(2010, 4, 1), date(2010, 5, 1), date(2010, 6, 1), date(2010, 7, 1), date(2010, 8, 1)]
        },
        {'filter_type': 'exclusive', 'date_ranges': [
            {'start': '2010-02-01', 'end': '2010-04-01'},
            {'start': '2010-06-01', 'end': '2010-08-01'},
        ]}
    ]])
    np.testing.assert_array_equal(v.data()['values'], [[1, 5], [1, 5]])

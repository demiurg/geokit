from datetime import date, timedelta
from psycopg2.extras import DateRange

import pytest
import mock
import numpy as np
import numpy.ma as ma
import pandas

from django.contrib.gis.geos import GEOSGeometry
from django.core.exceptions import ObjectDoesNotExist

from layers.models import Feature
from variables.models import Variable


def _scalar_val(val):
    return val


def _matrix_val(d):
    return pandas.DataFrame(
        data=d['values'],
        index=d['spatial_key'],
        columns=d['temporal_key']
    )


spatial_key = [1, 2]
temporal_key = [
    DateRange(date(2010, 1, 1), date(2010, 1, 2)),
    DateRange(date(2010, 1, 2), date(2010, 1, 3))
]
spatial_key3 = [1, 2, 3]
temporal_key3 = [
    DateRange(date(2010, 1, 1), date(2010, 1, 2)),
    DateRange(date(2010, 1, 2), date(2010, 1, 3)),
    DateRange(date(2010, 1, 3), date(2010, 1, 4))
]


def test_arithmetic_operators_scalar():
    v = Variable(tree=['+', [_scalar_val(1), _scalar_val(2)]])
    assert v.data() == _scalar_val(3)

    v = Variable(tree=['+', [['+', [_scalar_val(1), _scalar_val(2)]], _scalar_val(3)]])
    assert v.data() == _scalar_val(6)

    v = Variable(tree=['+', [_scalar_val(3), ['+', [_scalar_val(1), _scalar_val(2)]]]])
    assert v.data() == _scalar_val(6)

    v = Variable(tree=['-', [['-', [_scalar_val(6), _scalar_val(2)]], _scalar_val(1)]])
    assert v.data() == _scalar_val(3)

    v = Variable(tree=['*', [_scalar_val(3), ['*', [_scalar_val(1), _scalar_val(3)]]]])
    assert v.data() == _scalar_val(9)

    v = Variable(tree=['/', [_scalar_val(3), _scalar_val(1)]])
    assert v.data() == _scalar_val(3)


def test_arithmetic_operators_matrices():
    v = Variable(tree=['+', [
        _matrix_val({
            'values': np.array([[1, 2], [3, 4]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        }),
        _matrix_val({
            'values': np.array([[2, 3], [4, 5]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        })
    ]])
    np.testing.assert_array_equal(
        v.data().values, np.array([[3, 5], [7, 9]])
    )

    v = Variable(tree=['+', [
        _matrix_val({
            'values': np.array([[1, 2], [3, 4]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        }),
        _scalar_val(2)
    ]])
    np.testing.assert_array_equal(v.data().values, np.array([[3, 4], [5, 6]]))

    v = Variable(tree=['+', [
        _matrix_val({
            'values': np.array([[1, 2], [3, 4]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        }),
        _matrix_val({
            'values': np.array([[1, 2, 3], [4, 5, 6]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key3
        })
    ]])
    with pytest.raises(ValueError):
        v.data()


def test_mean_operator():
    v = Variable(tree=['mean', [
        _matrix_val({
            'values': np.array([[1, 2], [3, 4]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        }),
        _matrix_val({
            'values': np.array([[5, 6], [7, 8]]),
            'spatial_key': spatial_key,
            'temporal_key': temporal_key
        })
    ]])
    np.testing.assert_array_equal(v.data().values, np.array([[3, 4], [5, 6]]))

    with pytest.raises(ValueError):
        v = Variable(tree=['mean', [
            _matrix_val({
                'values': np.array([[1, 2], [3, 4]]),
                'spatial_key': spatial_key,
                'temporal_key': temporal_key
            }),
            _matrix_val({
                'values': np.array([[1], [2]]),
                'spatial_key': [1],
                'temporal_key': [date(2010, 1, 1)]
            }),
        ]])
        v.data()


def test_spatial_mean_operator():
    v = Variable(tree=['smean', [
        _matrix_val({
            'values': np.array([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]),
            'spatial_key': spatial_key3,
            'temporal_key': temporal_key3
        })
    ]])

    np.testing.assert_array_equal(v.data().values, np.array([4, 5, 6]))


def test_temporal_mean_operator():
    v = Variable(tree=['tmean', [
        _matrix_val({
            'values': np.array([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]),
            'spatial_key': spatial_key3,
            'temporal_key': temporal_key3
        })
    ]])

    np.testing.assert_array_equal(v.data().values, np.array([2, 5, 8]))


@pytest.mark.django_db
def test_select_join_operator(set_schema, monkeypatch):
    with mock.patch('django.db.connection') as connection:
        connection.schema_name = 'test'
        connection.cursor.return_value.description.__iter__.return_value = (
            ('feature_id', 23, None, 4, None, None, None),
            ('record_id', 23, None, 4, None, None, None),
            ('date_range', 1082, None, 4, None, None, None),
            ('tmin', 25, None, -1, None, None, None)
        )

        connection.cursor.return_value.fetchall.return_value = [
            (1, 1, DateRange(date(2010, 1, 1), date(2010, 1, 1)), 2),
            (1, 2, DateRange(date(2010, 1, 2), date(2010, 1, 2)), 5),
            (2, 1, DateRange(date(2010, 1, 1), date(2010, 1, 1)), 4),
            (2, 2, DateRange(date(2010, 1, 2), date(2010, 1, 2)), 8),
        ]

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'type': 'Layer', 'id': 1, 'field': 'fid'},
                    {'type': 'Table', 'id': 1, 'field': 'fid'},
                ]],
                'tmin',
            ]
        ])

        data = v.data()

        np.testing.assert_array_equal(data.values, np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'type': 'Layer', 'id': 1, 'field': 'fid'},
                    {'type': 'Table', 'id': 1, 'field': 'fid'},
                ]],
                'tmin'
            ]
        ])
        np.testing.assert_array_equal(v.data().values, np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'type': 'Table', 'id': 1, 'field': 'fid'},
                    {'type': 'Table', 'id': -1, 'field': 'fid'},
                ]],
                'test'
            ]
        ])

        with pytest.raises(ObjectDoesNotExist):
            v.data()

        v = Variable(tree=[
            'select', [
                ['join', [
                    {'type': 'Layer', 'id': 1, 'field': 'fid'},
                    {'type': 'Layer', 'name': "", 'field': 'fid'},
                ]],
                'test'
            ]
        ])

        with pytest.raises(ObjectDoesNotExist):
            v.data()


@pytest.mark.skip('not needed functionality for now')
@pytest.mark.django_db
def test_join_operator(set_schema, monkeypatch):
    with mock.patch('django.db.connection') as connection:
        connection.schema_name = 'test'
        connection.cursor.return_value.fetchall.return_value = [
            (1, None, None, {'tmin': 2}, DateRange(date(2010, 1, 1), date(2010, 1, 1))),
            (2, None, None, {'tmin': 5}, DateRange(date(2010, 1, 2), date(2010, 1, 2))),
            (1, None, None, {'tmin': 4}, DateRange(date(2010, 1, 1), date(2010, 1, 1))),
            (2, None, None, {'tmin': 8}, DateRange(date(2010, 1, 2), date(2010, 1, 2))),
        ]

        v = Variable(tree=['join', [
            {'type': 'Layer', 'id': 1, 'name': 'cnty24k97', 'field': 'fid'},
            {'type': 'Table', 'id': 1, 'name': 'cnty24k97_data', 'field': 'fid'},
            'tmin'
        ]])

        np.testing.assert_array_equal(v.data().values, np.array([
            [2, 5], [4, 8]
        ]))

        v = Variable(tree=['join', [
            {'type': 'Table', 'id': 1, 'name': 'cnty24k97_data', 'field': 'fid'},
            {'type': 'Layer', 'id': 1, 'name': 'cnty24k97', 'field': 'fid'},
            'tmin'
        ]])

        np.testing.assert_array_equal(v.data().values, np.array([
            [2, 5], [4, 8]
        ]))

        # THIS JOIN only works between tables and layers

        v = Variable(tree=['join', [
            {'type': 'Table', 'id': 1, 'field': 'fid'},
            {'type': 'Table', 'id': 1, 'field': 'fid'},
            'test'
        ]])
        with pytest.raises(ValueError):
            v.data()

        v = Variable(tree=['join', [
            {'type': 'Layer', 'id': 1, 'field': 'fid'},
            {'type': 'Layer', 'id': 1, 'field': 'fid'},
            'test'
        ]])
        with pytest.raises(ValueError):
            v.data()


def test_value_filter_operator():
    test_matrix = _matrix_val({
        'values': np.array([[1, 2], [3, 4]]),
        'spatial_key': spatial_key,
        'temporal_key': temporal_key
    })

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [float('nan'), float('nan')], [float('nan'), 4]
    ])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '>=', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [float('nan'), float('nan')], [3, 4]
    ])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [1, 2], [float('nan'), float('nan')]
    ])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '<=', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [1, 2], [3, float('nan')]
    ])

    v = Variable(tree=['filter', [
        test_matrix, {'comparison': '==', 'comparator': 3}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [float('nan'), float('nan')], [3, float('nan')]
    ])

    masked_matrix = _matrix_val({
        'values': ma.array([[float('nan'), float('nan')], [3, float('nan')]]),
        'spatial_key': spatial_key,
        'temporal_key': temporal_key
    })
    v = Variable(tree=['filter', [
        masked_matrix, {'comparison': '==', 'comparator': 2}
    ]])
    np.testing.assert_array_equal(v.data().values, [
        [float('nan'), float('nan')], [float('nan'), float('nan')]
    ])


@pytest.mark.skip('not needed functionality for now')
def test_spatial_filter():
    f1 = Feature()
    f2 = Feature()
    f1.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 12 12, 12 18, 18 18, 18 17, 12 12)))')
    f2.geometry = GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 1 1, 1 2, 2 2, 2 1, 1 1)))')

    v = Variable(tree=['sfilter', [
        {
            'values': np.array([
                [1, 2, 3, 4],
                [5, 6, 7, 8]
            ]),
            'spatial_key': [f1, f2],
            'temporal_key': []
        },
        {'filter_type': 'inclusive', 'containing_geometries': [
            GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10 )))')
        ]}
    ]])
    np.testing.assert_array_equal(v.data().values, [[1, 2, 3, 4]])

    v = Variable(tree=['sfilter', [
        {'values': np.array([[1, 2, 3, 4], [5, 6, 7, 8]]), 'spatial_key': [f1, f2], 'temporal_key': []},
        {'filter_type': 'exclusive', 'containing_geometries': [
            GEOSGeometry('GEOMETRYCOLLECTION(POLYGON(( 10 10, 10 20, 20 20, 20 15, 10 10 )))')
        ]}
    ]])
    np.testing.assert_array_equal(v.data().values, [[5, 6, 7, 8]])


def test_temporal_filter_operator():
    twobyeight = _matrix_val({
        'values': np.array([
            [1, 2, 3, 4, 5, 6, 7, 8],
            [1, 2, 3, 4, 5, 6, 7, 8]
        ]),
        'spatial_key': [1, 2],
        'temporal_key': [
            DateRange(date(2010, 1, 1), date(2010, 1, 2)),
            DateRange(date(2010, 1, 2), date(2010, 1, 3)),
            DateRange(date(2010, 1, 3), date(2010, 1, 4)),
            DateRange(date(2010, 1, 4), date(2010, 1, 5)),
            DateRange(date(2010, 1, 5), date(2010, 1, 6)),
            DateRange(date(2010, 1, 6), date(2010, 1, 7)),
            DateRange(date(2010, 1, 7), date(2010, 1, 8)),
            DateRange(date(2010, 1, 8), date(2010, 1, 9)),
        ]
    })

    v = Variable(tree=['tfilter', [twobyeight, {
        'filter_type': 'inclusive', 'date_ranges': [
            {'start': '2010-01-02', 'end': '2010-01-04'},
            {'start': '2010-01-06', 'end': '2010-01-08'},
        ]
    }]])

    np.testing.assert_array_equal(v.data().values,[
        [2, 3, 4, 6, 7, 8],
        [2, 3, 4, 6, 7, 8]
    ])

    v = Variable(tree=['tfilter', [twobyeight, {
        'filter_type': 'exclusive', 'date_ranges': [
            {'start': '2010-01-02', 'end': '2010-01-04'},
            {'start': '2010-01-06', 'end': '2010-01-08'},
        ]
    }]])
    np.testing.assert_array_equal(v.data().values, [
        [1, 5],
        [1, 5]
    ])

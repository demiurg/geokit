import pytest
import numpy as np
from django.core.exceptions import ObjectDoesNotExist
from variables.models import Variable


@pytest.mark.django_db
def test_abscent_source(set_schema):
    v = Variable(tree=[
        'join', [
            {'type': 'Layer', 'id': -1, 'name': 'cnty_24k97', 'field': 'fid'},
            {'type': 'Table', 'id': -1, 'name': 'cnty_24k97_data', 'field': 'fid'},
        ]
    ])

    with pytest.raises(ObjectDoesNotExist):
        v.data()


@pytest.mark.django_db
def test_example_0_5_select(set_schema):
    tmin = [
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 26, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ]
    tmax = [
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 26, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmax'
        ]
    ]

    t_summer = ['tfilter', [
        ['mean', [
            tmin,
            tmax
        ]],
        {
            'filter_type': 'inclusive',
            'date_ranges': [
                {'start': '2010-06-01', 'end': '2010-08-31'},
                {'start': '2011-06-01', 'end': '2011-08-31'},
                {'start': '2012-06-01', 'end': '2012-08-31'},
                {'start': '2013-06-01', 'end': '2013-08-31'},
                {'start': '2014-06-01', 'end': '2014-08-31'}
            ]
        }
    ]]

    t_norm_summer = Variable(tree=['tmean', [t_summer]])
    print t_norm_summer.data()
    assert np.allclose(
        t_norm_summer.data().values, [
            14.188587, 22.986413
        ]
    )

@pytest.mark.django_db
def test_select_one_table(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['source', [
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])

    assert len(tmin.data()) == 3650


@pytest.mark.django_db
def test_join_two_tables(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['join', [
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])
    assert len(tmin.data()) == 3650


@pytest.mark.django_db
def test_join_two_sources(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['join', [
                ['source', [
                    {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
                ]],
                ['source', [
                    {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
                ]],
            ]],
            'tmin'
        ]
    ])
    assert len(tmin.data()) == 3650


@pytest.mark.django_db
def test_get_layers(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 26, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])

    assert tmin.get_layers() == set([26])


@pytest.mark.django_db
def test_dimensions(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['source', [
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])
    assert tmin.dimensions == 'time'

    counties = Variable(tree=[
        'select', [
            ['source', [
                {'type': 'Layer', 'id': 26, 'name': 'cnty_24k97', 'field': 'fid'},
            ]],
            'name'
        ]
    ])

    assert counties.dimensions == 'space'

    tmin = Variable(tree=[
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 26, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 30, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])

    assert tmin.dimensions == 'spacetime'

@pytest.mark.django_db
def test_raster(set_schema):
    tree = ["select", [
        ["raster", [
            { "id": "modis_indices_ndvi", "name": "Land indices"},
            [ "source", [
                { "field": "fid", "type": "Layer", "id": "26", "name": "cnty_24k97"}
            ]],
            "2015-001,2015-030"
        ]],
        {"field": "mean", "name": "raster"}
    ]]

    mean = Variable(tree=tree)
    len(mean.get_layers()) == 1
    len(mean.get_rasters()) == 1

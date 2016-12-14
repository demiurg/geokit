import pytest
import numpy as np
from django.core.exceptions import ObjectDoesNotExist
from variables.models import Variable


@pytest.mark.django_db
def test_abscent_source(set_schema):
    v = Variable(tree=[
        'join', [
            {'type': 'Layer', 'id': 1, 'name': 'cnty_24k97', 'field': 'fid'},
            {'type': 'Table', 'id': 1, 'name': 'cnty_24k97_data', 'field': 'fid'},
        ]
    ])

    with pytest.raises(ObjectDoesNotExist):
        v.data()


@pytest.mark.django_db
def test_example_0_5_select(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 1, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 1, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])
    tmax = Variable(tree=[
        'select', [
            ['join', [
                {'type': 'Layer', 'id': 1, 'name': 'cnty_24k97', 'field': 'fid'},
                {'type': 'Table', 'id': 1, 'name': 'cnty_24k97_data', 'field': 'fid'},
            ]],
            'tmax'
        ]
    ])

    t_summer = Variable(
        tree=['tfilter', [
            ['mean', [
                tmin.data(),
                tmax.data()
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
    )
    t_norm_summer = Variable(tree=['tmean', [t_summer.data()]])

    np.testing.assert_array_equal(
        t_norm_summer.data()['values'], np.array([[7.45], [17.7]])
    )

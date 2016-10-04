from dateutil.rrule import rrule, DAILY
import pytest
import numpy as np

from layers.models import Feature
from variables.models import Variable


@pytest.mark.django_db
def test_example_0_5(set_schema):
    tmin = Variable(tree=['join', [
        {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
        {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
        'tmin'
    ]])
    tmax = Variable(tree=['join', [
        {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
        {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
        'tmax'
    ]])
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
        ]],
        #spatial_domain=list(Feature.objects.filter(layer='cnty24k97')),
        #temporal_domain=rrule(DAILY, dtstart=date(2010, 1, 1), until=date(2014, 12, 31))
    )
    t_norm_summer = Variable(tree=['tmean', [t_summer.data()]])

    np.testing.assert_array_equal(t_norm_summer.data()['values'], np.array([[13.175], [22.4]]))


@pytest.mark.django_db
def test_example_0_5_select(set_schema):
    tmin = Variable(tree=[
        'select', [
            ['join', [
                {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
                {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
            ]],
            'tmin'
        ]
    ])
    tmax = Variable(tree=[
        'select', [
            ['join', [
                {'model': 'Layer', 'id': 'cnty24k97', 'field': 'fid'},
                {'model': 'Table', 'id': 'cnty24k97_data', 'field': 'fid'},
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
        ]],
        #spatial_domain=list(Feature.objects.filter(layer='cnty24k97')),
        #temporal_domain=rrule(DAILY, dtstart=date(2010, 1, 1), until=date(2014, 12, 31))
    )
    t_norm_summer = Variable(tree=['tmean', [t_summer.data()]])

    np.testing.assert_array_equal(t_norm_summer.data()['values'], np.array([[13.175], [22.4]]))

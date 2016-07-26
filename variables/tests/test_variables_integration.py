from datetime import datetime
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
    print(tmin.data())
    print(tmax.data())
    t_summer = Variable(
        tree=['tfilter', [
            ['mean', [
                tmin.data(),
                tmax.data()
            ]],
            {
                'filter_type': 'inclusive',
                'date_ranges': [
                    {'start': datetime(2010, 6, 1), 'end': datetime(2010, 8, 31)},
                    {'start': datetime(2011, 6, 1), 'end': datetime(2011, 8, 31)},
                    {'start': datetime(2012, 6, 1), 'end': datetime(2012, 8, 31)},
                    {'start': datetime(2013, 6, 1), 'end': datetime(2013, 8, 31)},
                    {'start': datetime(2014, 6, 1), 'end': datetime(2014, 8, 31)}
                ]
            }
        ]],
        spatial_domain=list(Feature.objects.filter(layer='cnty24k97')),
        temporal_domain=rrule(DAILY, dtstart=datetime(2010, 1, 1), until=datetime(2014, 12, 31))
    )
    print(t_summer.data())
    t_norm_summer = Variable(tree=['tmean', [t_summer.data()]])

    np.testing.assert_array_equal(t_norm_summer.data(), np.array([[1], [2]]))

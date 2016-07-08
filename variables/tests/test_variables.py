import numpy as np

from dateutil.rrule import rrule, DAILY
from datetime import date

from variables.models import Variable


def mock_value():
    return np.array([
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18]
    ])

mock_temporal_domain = list(rrule(freq=DAILY, count=6, dtstart=date(2010, 1, 1)))

mock_spatial_domain = [1, 2, 3]


def test_arithmetic_operators():
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

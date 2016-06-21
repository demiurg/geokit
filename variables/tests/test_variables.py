import numpy as np
from collections import namedtuple

from dateutil.rrule import rrule, DAILY
from datetime import date

from expressions.helpers import ExpressionResult
from expressions.models import Expression
from variables.models import Variable, VariableDataSource, ExpressionDataSource, UploadsDataSource


def mock_value():
    return np.array([
        [1, 2, 3, 4, 5, 6],
        [7, 8, 9, 10, 11, 12],
        [13, 14, 15, 16, 17, 18]
    ])

mock_temporal_domain = list(rrule(freq=DAILY, count=6, dtstart=date(2010, 1, 1)))

mock_spatial_domain = [1, 2, 3]


def test_variable_data_source_value(monkeypatch):
    parent_variable = Variable()
    monkeypatch.setattr(parent_variable, 'data', mock_value)
    monkeypatch.setattr(parent_variable, 'temporal_domain', mock_temporal_domain)
    monkeypatch.setattr(parent_variable, 'spatial_domain', mock_spatial_domain)

    ds = VariableDataSource(parent_variable=parent_variable)
    var = Variable(data_source=ds, temporal_domain=mock_temporal_domain, spatial_domain=mock_spatial_domain)

    np.testing.assert_array_equal(var.data(), mock_value())


def test_expression_data_source_value(monkeypatch):
    def mock_evaluate(_user):
        return ExpressionResult(
            mock_value(),
            mock_temporal_domain,
            mock_spatial_domain
        )

    exp = Expression()
    monkeypatch.setattr(exp, 'evaluate', mock_evaluate)

    ds = ExpressionDataSource(expression=exp)
    var = Variable(data_source=ds, temporal_domain=mock_temporal_domain, spatial_domain=mock_spatial_domain)

    np.testing.assert_array_equal(var.data(), mock_value())


def test_uploads_data_source_value(monkeypatch):
    def mock_join(self):
        return mock_value(), mock_temporal_domain, mock_spatial_domain

    monkeypatch.setattr(UploadsDataSource, 'join_uploads', mock_join)

    ds = UploadsDataSource()
    var = Variable(data_source=ds, temporal_domain=mock_temporal_domain, spatial_domain=mock_spatial_domain)

    np.testing.assert_array_equal(var.data(), mock_value())

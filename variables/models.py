from __future__ import unicode_literals

import numpy as np

from django.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField
from django.dispatch import receiver

from geokit_tables.models import GeoKitTable
from layers.models import Layer

from expressions.helpers import join_layer_and_table
from expressions.models import Expression


DATASOURCE_TYPES = (
    ('variabledatasource', 'Variable'),
    ('expressiondatasource', 'Expression'),
    ('uploadsdatasource', 'Uploads'),
)


class DataSource(models.Model):
    def _populate_value_matrix(self, source_values, source_spatial_key, source_temporal_key):
        output = np.empty((len(self.variable.spatial_domain), len(self.variable.temporal_domain)))

        for i, location in enumerate(self.variable.spatial_domain):
            for j, date in enumerate(self.variable.temporal_domain):
                try:
                    spatial_index = source_spatial_key.index(location)
                    temporal_index = source_temporal_key.index(date)

                    output[i][j] = source_values[spatial_index][temporal_index]
                except ValueError as e:
                    output[i][j] = np.nan

        return output


class VariableDataSource(DataSource):
    parent_variable = models.ForeignKey('Variable')

    def value(self):
        source_values = self.parent_variable.data()
        source_temporal_key = self.parent_variable.temporal_domain
        source_spatial_key = self.parent_variable.spatial_domain

        return self._populate_value_matrix(source_values, source_spatial_key, source_temporal_key)


class ExpressionDataSource(DataSource):
    expression = models.ForeignKey(Expression)

    def value(self):
        expression_result = self.expression.evaluate(None)
        source_values = expression_result.vals
        source_temporal_key = expression_result.temporal_key
        source_spatial_key = expression_result.spatial_key

        return self._populate_value_matrix(source_values, source_spatial_key, source_temporal_key)


class UploadsDataSource(DataSource):
    layer = models.ForeignKey(Layer)
    layer_join_field = models.CharField(max_length=200)
    table = models.ForeignKey(GeoKitTable)
    table_join_field = models.CharField(max_length=200)

    def join_uploads(self):
        return join_layer_and_table(
            self.layer.name,
            self.layer_join_field,
            self.table.name,
            self.table_join_field
        )

    def value(self):
        source_values, source_temporal_key, source_spatial_key = self.join_uploads()

        return self._populate_value_matrix(source_values, source_spatial_key, source_temporal_key)


class Variable(models.Model):
    name = models.CharField(primary_key=True, max_length=75)
    temporal_domain = ArrayField(DateRangeField())
    spatial_domain = ArrayField(models.IntegerField())
    data_source = models.OneToOneField(DataSource)
    units = models.CharField(max_length=100)

    def data(self):
        return self.data_source.value()

    def __unicode__(self):
        return self.name

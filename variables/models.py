from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField

from geokit_tables.models import GeoKitTable
from layers.models import Layer

from expressions.helpers import join_layer_and_table


DATASOURCE_TYPES = (
    ('variabledatasource', 'Variable'),
    ('uploadsdatasource', 'Uploads'),
)


class DataSource(models.Model):
    source_type = models.CharField(max_length=20, choices=DATASOURCE_TYPES)

    def value(self, temporal_domain, spatial_domain):
        '''
        Attempt at multiple dispatch. It is important to note that for this to
        work DATASOURCE_TYPES keys must be the name of the DataSource property
        that points to it's subclass.

        e.g. If the DataSource is a VariableDataSource, self.source_type must
        be 'variabledatasource' so we can call `self.variabledatasource.value()`.
        '''
        getattr(self, self.source_type).value(temporal_domain, spatial_domain)


class VariableDataSource(DataSource):
    variable = models.ForeignKey('Variable')

    def value(self, temporal_domain, spatial_domain):
        return self.variable.value()


class UploadsDataSource(DataSource):
    layer = models.ForeignKey(Layer)
    layer_join_field = models.CharField(max_length=200)
    table = models.ForeignKey(GeoKitTable)
    table_join_field = models.CharField(max_length=200)

    def value(self, temporal_domain, spatial_domain):
        values, temporal_key, spatial_key = join_layer_and_table(
            self.layer.name,
            self.layer_join_field,
            self.table.name,
            self.table_join_field
        )


class Variable(models.Model):
    name = models.CharField(primary_key=True, max_length=75)
    temporal_domain = ArrayField(DateRangeField())
    spatial_domain = ArrayField(models.IntegerField())
    data_source = models.ForeignKey(DataSource)
    units = models.CharField(max_length=100)

    @property
    def data(self):
        self.data_source.value(self.temporal_domain, self.spatial_domain)

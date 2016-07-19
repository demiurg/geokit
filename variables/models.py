from __future__ import unicode_literals

import numpy as np
import numpy.ma as ma

from django.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField, JSONField

from geokit_tables.models import GeoKitTable
from layers.models import Layer

from expressions.helpers import join_layer_and_table


class Variable(models.Model):
    name = models.CharField(primary_key=True, max_length=75)
    temporal_domain = ArrayField(DateRangeField())
    spatial_domain = ArrayField(models.IntegerField())
    tree = JSONField()
    units = models.CharField(max_length=100)

    def data(self):
        operator = self.resolve_operator(self.tree[0])
        return operator(*self.tree[1])

    def __unicode__(self):
        return self.name

    def resolve_operator(self, text):
        operator_table = {
            '+': self.IterativeOperator(np.add),
            '-': self.IterativeOperator(np.subtract),
            '*': self.IterativeOperator(np.multiply),
            '/': self.IterativeOperator(np.divide),

            'smean': self.SpatialMeanOperator,
            'tmean': self.TemporalMeanOperator,

            'filter': self.ValueFilterOperator,
            'sfilter': self.SpatialFilterOperator,
            'tfilter': self.TemporalFilterOperator,

            'join': self.JoinOperator,
        }

        return operator_table[text]

    def resolve_arguments(self, *args):
        resolved_args = []
        for arg in args:
            if type(arg) == list:
                resolved_args.append(self.resolve_operator(arg[0])(*arg[1]))
            else:
                resolved_args.append(arg)

        return tuple(resolved_args)

    def IterativeOperator(self, func):
        def f(left, right):
            left_val, right_val = self.resolve_arguments(left, right)

            if type(left) == np.ndarray and type(right) == np.ndarray and left.shape != right.shape:
                raise ValueError("Arguments must be of equal dimensions")

            return func(left_val, right_val)
        return f

    def SpatialMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val, axis=0)
        return mean_vals.reshape(1, len(mean_vals))

    def TemporalMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val, axis=1)
        return mean_vals.reshape(len(mean_vals), 1)

    def SpatialFilterOperator(self):
        pass

    def TemporalFilterOperator(self, val, filter_):
        pass

    def ValueFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'comparison': '<',
            'comparator': 5
        }`
        '''
        (val,) = self.resolve_arguments(val)
        if filter_['comparison'] == '<':
            masked_val = ma.masked_where(val < filter_['comparator'], val)
        elif filter_['comparison'] == '<=':
            masked_val = ma.masked_where(val <= filter_['comparator'], val)
        elif filter_['comparison'] == '==':
            masked_val = ma.masked_where(val == filter_['comparator'], val)
        elif filter_['comparison'] == '>=':
            masked_val = ma.masked_where(val >= filter_['comparator'], val)
        elif filter_['comparison'] == '>':
            masked_val = ma.masked_where(val > filter_['comparator'], val)

        return masked_val

    def JoinOperator(self, left, right, field):
        '''
        Serialization format:
        `{
            'model': 'GeoKitTable',
            'id': 1,
            'field': 'fid'
        }`
        '''
        if left['model'] == 'Layer':
            if right['model'] != 'GeoKitTable':
                raise ValueError("Arguments must be a Layer and GeoKitTable")
            layer = Layer.objects.get(pk=left['id'])
            layer_field = left['field']
            table = GeoKitTable.objects.get(pk=right['id'])
            table_field = right['field']

        if left['model'] == 'GeoKitTable':
            if right['model'] != 'Layer':
                raise ValueError("Arguments must be a Layer and GeoKitTable")
            layer = Layer.objects.get(pk=right['id'])
            layer_field = right['field']
            table = GeoKitTable.objects.get(pk=left['id'])
            table_field = left['field']

        return np.array(join_layer_and_table(layer.name, layer_field, table.name, table_field, field)[0]).astype('float64')

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

    def __init__(self, *args, **kwargs):
        super(Variable, self).__init__(*args, **kwargs)

        self.current_dimensions = {
            'spatial_domain': self.spatial_domain,
            'temporal_domain': self.temporal_domain
        }

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

            'mean': self.MeanOperator,
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

    def MeanOperator(self, left, right):
        left_val, right_val = self.resolve_arguments(left, right)

        if left_val.shape != right_val.shape:
            raise ValueError("Arguments must be of equal dimensions")

        return np.mean([left_val, right_val], axis=0)

    def SpatialMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val, axis=0)

        self.current_dimensions['spatial_domain'] = []
        return mean_vals.reshape(1, len(mean_vals))

    def TemporalMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val, axis=1)

        self.current_dimensions['temporal_domain'] = []
        return mean_vals.reshape(len(mean_vals), 1)

    def SpatialFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'containing_geometries': [],
            'filter_type': 'inclusive'
        }`
        '''
        (val,) = self.resolve_arguments(val)

        indices_to_delete = set()
        for i, feature in enumerate(self.current_dimensions['spatial_domain']):
            for geometry in filter_['containing_geometries']:
                contains = geometry.contains(feature.geometry)

                if filter_['filter_type'] == 'inclusive' and not contains:
                    indices_to_delete.add(i)
                elif filter_['filter_type'] == 'exlcusive' and contains:
                    indices_to_delete.add(i)

        val = np.delete(val, list(indices_to_delete), 0)
        self.current_dimensions['spatial_domain'] = list(np.delete(self.current_dimensions['spatial_domain'], list(indices_to_delete)))
        return val

    def TemporalFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'date_ranges': [{'start': datetime.date(2000,1,1), 'end': datetime.date(2005,5,1)}, {...}],
            'filter_type': 'inclusive'
        }`
        '''
        (val,) = self.resolve_arguments(val)

        indices_to_delete = set()
        for i, date in enumerate(self.current_dimensions['temporal_domain']):
            for date_range in filter_['date_ranges']:
                in_range = date_range['start'] <= date <= date_range['end']

                if filter_['filter_type'] == 'inclusive' and not in_range:
                    indices_to_delete.add(i)
                elif filter_['filter_type'] == 'exclusive' and in_range:
                    indices_to_delete.add(i)

        val = np.delete(val, list(indices_to_delete), 1)
        self.current_dimensions['temporal_domain'] = list(np.delete(self.current_dimensions['temporal_domain'], list(indices_to_delete)))
        return val

    def ValueFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'comparison': '<',
            'comparator': 5
        }`
        '''
        (val,) = self.resolve_arguments(val)
        if hasattr(val, 'mask'):
            data = val.data
        else:
            data = val

        if filter_['comparison'] == '<':
            mask = data < filter_['comparator']
        elif filter_['comparison'] == '<=':
            mask = data <= filter_['comparator']
        elif filter_['comparison'] == '==':
            mask = data == filter_['comparator']
        elif filter_['comparison'] == '>=':
            mask = data >= filter_['comparator']
        elif filter_['comparison'] == '>':
            mask = data > filter_['comparator']

        if hasattr(val, 'mask'):
            val.mask = np.bitwise_or(val.mask, mask)
            return val
        else:
            return ma.masked_array(val, mask=mask)

    def JoinOperator(self, left, right, field):
        '''
        Serialization format:
        `{
            'model': 'Table',
            'id': 1,
            'field': 'fid'
        }`
        '''
        if left['model'] == 'Layer':
            if right['model'] != 'Table':
                raise ValueError("Arguments must be a Layer and Table")
            layer = Layer.objects.get(pk=left['id'])
            layer_field = left['field']
            table = GeoKitTable.objects.get(pk=right['id'])
            table_field = right['field']

        if left['model'] == 'Table':
            if right['model'] != 'Layer':
                raise ValueError("Arguments must be a Layer and Table")
            layer = Layer.objects.get(pk=right['id'])
            layer_field = right['field']
            table = GeoKitTable.objects.get(pk=left['id'])
            table_field = left['field']

        return np.array(join_layer_and_table(layer.name, layer_field, table.name, table_field, field)[0]).astype('float64')

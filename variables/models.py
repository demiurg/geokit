from __future__ import unicode_literals

from datetime import datetime

import numpy as np
import numpy.ma as ma

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField

from geokit_tables.models import GeoKitTable
from layers.models import Layer

from data import DataSource, join_layer_and_table
import json


class Variable(models.Model):
    name = models.SlugField(max_length=75, blank=False)
    description = models.TextField(null=True, blank=True)
    temporal_domain = ArrayField(models.DateField(), null=True, blank=True)
    spatial_domain = ArrayField(models.IntegerField(), null=True, blank=True)
    tree = JSONField()
    input_variables = JSONField(null=True, default=[])
    units = models.CharField(max_length=100, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        super(Variable, self).__init__(*args, **kwargs)

        self.current_dimensions = {
            'spatial_domain': self.spatial_domain,
            'temporal_domain': self.temporal_domain
        }

    def tree_json(self):
        return json.dumps(self.tree)

    def input_variables_json(self):
        return json.dumps(self.input_variables)

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
            'select': self.SelectOperator,
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

            if (
                type(left_val['values']) == np.ndarray and
                type(right_val['values']) == np.ndarray and
                left_val['values'].shape != right_val['values'].shape
            ):
                raise ValueError("Arguments must be of equal dimensions")

            values = func(left_val['values'], right_val['values'])
            return {
                'values': values,
                'spatial_key': left_val['spatial_key'],
                'temporal_key': left_val['temporal_key']
            }  # Left and right keys are identical
        return f

    def MeanOperator(self, left, right):
        left_val, right_val = self.resolve_arguments(left, right)

        if left_val['values'].shape != right_val['values'].shape:
            raise ValueError("Arguments must be of equal dimensions")

        values = np.mean([left_val['values'], right_val['values']], axis=0)
        return {
            'values': values,
            'spatial_key': left_val['spatial_key'],
            'temporal_key': left_val['temporal_key']
        }  # Left and right keys are identical

    def SpatialMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val['values'], axis=0)

        return {
            'values': mean_vals.reshape(1, len(mean_vals)),
            'spatial_key': [],
            'temporal_key': val['temporal_key']
        }

    def TemporalMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)

        mean_vals = np.mean(val['values'], axis=1)

        return {
            'values': mean_vals.reshape(len(mean_vals), 1),
            'spatial_key': val['spatial_key'],
            'temporal_key': []
        }

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
        for i, feature in enumerate(val['spatial_key']):
            contains = False
            for geometry in filter_['containing_geometries']:
                if geometry.contains(feature.geometry):
                    contains = True
                    break

            if filter_['filter_type'] == 'inclusive' and not contains:
                indices_to_delete.add(i)
            elif filter_['filter_type'] == 'exclusive' and contains:
                indices_to_delete.add(i)
        values = np.delete(val['values'], list(indices_to_delete), 0)
        spatial_key = np.delete(val['spatial_key'], list(indices_to_delete))
        return {
            'values': values,
            'spatial_key': spatial_key,
            'temporal_key': val['spatial_key']
        }

    def TemporalFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'date_ranges': [{'start': '2010-01-01', 'end': '2005-05-30'}, {...}],
            'filter_type': 'inclusive'
        }`
        '''
        (val,) = self.resolve_arguments(val)

        indices_to_delete = set()
        for i, a_date_range in enumerate(val['temporal_key']):
            in_range = False
            for b_date_range in filter_['date_ranges']:
                start = datetime.strptime(b_date_range['start'], "%Y-%m-%d").date()
                end = datetime.strptime(b_date_range['end'], "%Y-%m-%d").date()
                start = max(start, a_date_range.lower)
                end = min(end, a_date_range.upper)
                if ((end - start).days + 1) > 0:
                    in_range = True
                    break

            if filter_['filter_type'] == 'inclusive' and not in_range:
                indices_to_delete.add(i)
            elif filter_['filter_type'] == 'exclusive' and in_range:
                indices_to_delete.add(i)

        values = np.delete(val['values'], list(indices_to_delete), 1)
        temporal_key = list(np.delete(val['temporal_key'], list(indices_to_delete)))
        return {
            'values': values,
            'spatial_key': val['spatial_key'],
            'temporal_key': temporal_key
        }

    def ValueFilterOperator(self, val, filter_):
        '''
        Filter format:
        `{
            'comparison': '<',
            'comparator': 5
        }`
        '''
        (val,) = self.resolve_arguments(val)
        if hasattr(val['values'], 'mask'):
            data = val['values'].data
        else:
            data = val['values']

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

        if hasattr(val['values'], 'mask'):
            val['values'].mask = np.bitwise_or(val['values'].mask, mask)
            return {
                'values': val['values'],
                'spatial_key': val['spatial_key'],
                'temporal_key': val['temporal_key']
            }
        else:
            return {
                'values': ma.masked_array(val['values'], mask=mask),
                'spatial_key': val['spatial_key'],
                'temporal_key': val['temporal_key']
            }

    def SelectOperator(self, val, name):
        '''
        Serialization format:
        `{
            'model': 'Table',
            'id': 1,
            'field': 'fid'
        }`
        '''

        (source,) = self.resolve_arguments(val)
        source.select(name)
        return source.variable()

    def JoinLazy(self, left, right):
        return DataSource(left, right)

    def JoinOperator(self, left, right, field=None):
        '''
        Serialization format:
        `{
            'model': 'Table',
            'id': 1,
            'field': 'fid'
        }`
        '''

        if field is None:
            return self.JoinLazy(left, right)

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

        values, t_key, s_key = join_layer_and_table(
            layer.name, layer_field, table.name, table_field, field
        )

        return {
            'values': np.array(values).astype('float64'),
            'temporal_key': t_key, 'spatial_key': s_key
        }

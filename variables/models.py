from __future__ import unicode_literals

from datetime import datetime

import numpy as np
import numpy.ma as ma
import pandas

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField

from data import DataSource
import json
import operator


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
                resolved_args.append(
                    self.resolve_operator(arg[0])(*arg[1])
                )
            else:
                resolved_args.append(arg)

        return tuple(resolved_args)

    def IterativeOperator(self, func):
        def f(left, right):
            left_val, right_val = self.resolve_arguments(left, right)
            return func(left_val, right_val)

        return f

    def MeanOperator(self, left, right):
        left_val, right_val = self.resolve_arguments(left, right)
        values = (left_val + right_val) / 2
        return values

    def SpatialMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)
        return val.mean(axis=0)

    def TemporalMeanOperator(self, val):
        (val,) = self.resolve_arguments(val)
        return val.mean(axis=1)

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

        ranges = filter_['date_ranges']

        if filter_['filter_type'] == 'inclusive':
            comps = map(
                lambda r: (val.columns >= r['start']) & (val.columns <= r['end']),
                ranges
            )
            cols = reduce(operator.__or__, comps)
            return val.iloc[:,cols]
        elif filter_['filter_type'] == 'exclusive':
            comps = map(
                lambda r: (val.columns < r['start']) | (val.columns > r['end']),
                ranges
            )
            cols = reduce(operator.__and__, comps)
            return val.iloc[:,cols]

        raise ValueError('Invalid filter type {}'.format(filter_['filter_type']))

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
            return val.where(val < filter_['comparator'])
        elif filter_['comparison'] == '<=':
            return val.where(val <= filter_['comparator'])
        elif filter_['comparison'] == '==':
            return val.where(val == filter_['comparator'])
        elif filter_['comparison'] == '>=':
            return val.where(val >= filter_['comparator'])
        elif filter_['comparison'] == '>':
            return val.where(val > filter_['comparator'])

        # Should not be ere
        raise ValueError("Invalid comparator {}".format(filter_['comparator']))

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

    def JoinOperator(self, left, right):
        return DataSource(left, right)

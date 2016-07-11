from __future__ import unicode_literals

import numpy as np

from django.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField, JSONField


def resolve_arguments(*args):
    resolved_args = []
    for arg in args:
        if type(arg) == list:
            resolved_args.append(operator_table[arg[0]](*arg[1]))
        else:
            resolved_args.append(arg)

    return tuple(resolved_args)


def IterativeOperator(func):
    def f(left, right):
        left_val, right_val = resolve_arguments(left, right)

        if type(left) == np.ndarray and type(right) == np.ndarray and left.shape != right.shape:
            raise ValueError("Arguments must be of equal dimensions")

        return func(left_val, right_val)
    return f


def SpatialMeanOperator(val):
    (val,) = resolve_arguments(val)

    mean_vals = np.mean(val, axis=0)
    return mean_vals.reshape(1, len(mean_vals))


def TemporalMeanOperator(val):
    (val,) = resolve_arguments(val)

    mean_vals = np.mean(val, axis=1)
    return mean_vals.reshape(len(mean_vals), 1)


operator_table = {
    '+': IterativeOperator(np.add),
    '-': IterativeOperator(np.subtract),
    '*': IterativeOperator(np.multiply),
    '/': IterativeOperator(np.divide),

    'smean': SpatialMeanOperator,
    'tmean': TemporalMeanOperator,
}


class Variable(models.Model):
    name = models.CharField(primary_key=True, max_length=75)
    temporal_domain = ArrayField(DateRangeField())
    spatial_domain = ArrayField(models.IntegerField())
    tree = JSONField()
    units = models.CharField(max_length=100)

    def data(self):
        operator = operator_table[self.tree[0]]
        return operator(*self.tree[1])

    def __unicode__(self):
        return self.name

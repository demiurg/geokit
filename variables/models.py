from __future__ import unicode_literals

import numpy as np

from django.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField, JSONField


def resolve_arguments(left, right):
    if type(left) == list:
        left_val = operator_table[left[0]](*left[1])
    else:
        left_val = left

    if type(right) == list:
        right_val = operator_table[right[0]](*right[1])
    else:
        right_val = right

    return left_val, right_val


def IterativeOperator(func):
    def f(left, right):
        left_val, right_val = resolve_arguments(left, right)

        if type(left) == np.ndarray and type(right) == np.ndarray and left.shape != right.shape:
            raise ValueError("Arguments must be of equal dimensions")

        return func(left_val, right_val)
    return f


operator_table = {
    '+': IterativeOperator(np.add),
    '-': IterativeOperator(np.subtract),
    '*': IterativeOperator(np.multiply),
    '/': IterativeOperator(np.divide),
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

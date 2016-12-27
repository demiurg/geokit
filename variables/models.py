from __future__ import unicode_literals

from datetime import datetime
from psycopg2.extras import DateRange

import numpy as np
import pandas

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField

from data import DataNode
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
    status = models.IntegerField(
        choices=((0, 'Good'), (1, 'Working'), (3, 'Bad')), default=1
    )

    def __init__(self, *args, **kwargs):
        super(Variable, self).__init__(*args, **kwargs)

        self.current_dimensions = {
            'spatial_domain': self.spatial_domain,
            'temporal_domain': self.temporal_domain
        }

    @staticmethod
    def data_dimensions(data):
        if type(data) is pandas.Series:
            if type(data.index[0]) in (int, np.int64, np.int32):
                return 'space'
            elif type(data.index[0]) is DateRange:
                return 'time'
            else:
                raise TypeError(type(data.index[0]))
        elif (
            type(data) is pandas.DataFrame and (
                type(data.index[0]) in (int, np.int64, np.int32) and
                type(data.columns[0]) is DateRange
            )
        ):
            return "spacetime"
        else:
            raise TypeError(type(data))

    def tree_json(self):
        return json.dumps(self.tree)

    def input_variables_json(self):
        return json.dumps(self.input_variables)

    def data(self):
        return DataNode(*self.tree).execute()

    def __unicode__(self):
        return self.name

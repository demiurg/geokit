from __future__ import unicode_literals

from datetime import datetime
from psycopg2.extras import DateRange

import numpy as np
import pandas

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField

from layers.models import Layer
from data import treeToNode, DataSource
import json


class Variable(models.Model):
    name = models.SlugField(max_length=75, blank=False)
    description = models.TextField(null=True, blank=True)
    temporal_domain = ArrayField(models.DateField(), null=True, blank=True)
    spatial_domain = ArrayField(models.IntegerField(), null=True, blank=True)
    saved_dimensions = models.CharField(max_length=15, null=True)
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

        if self.tree:
            self.root = treeToNode(self.tree)
        else:
            self.root = None

        self.source_layers = None
        self.current_data = None

    def save(self, *args, **kwargs):
        self.saved_dimensions = self.dimensions()
        super(Variable, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.name

    def dimensions(self):
        return self.root.dimensions

    def tree_json(self):
        return json.dumps(self.tree)

    def input_variables_json(self):
        return json.dumps(self.input_variables)

    def get_source_layers(self):
        def walk_nodes(node):
            if type(node) == DataSource:
                node.execute()
                return set([Layer(pk=l['id']) for l in node.layers])
            elif type(node) == str:
                return set()
            else:
                source_layers = set()
                for operand in node.operands:
                    source_layers = source_layers.union(walk_nodes(operand))
                return source_layers

        if self.source_layers is None:
            self.source_layers = walk_nodes(self.root)

        return self.source_layers

    def data(self):
        if self.current_data is None:
            self.current_data = self.root.execute()

        return self.current_data

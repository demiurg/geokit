from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField
from django.utils.functional import cached_property
from layers.models import Layer
from data import treeToNode
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
        choices=((0, 'Good'), (1, 'Working'), (3, 'Bad')), default=0
    )

    @cached_property
    def root(self):
        return treeToNode(self.tree)

    def __init__(self, *args, **kwargs):
        super(Variable, self).__init__(*args, **kwargs)
        self.source_layers = None
        self.current_data = None

    def save(self, *args, **kwargs):
        if self.tree:
            try:
                self.saved_dimensions = self.root.dimensions
            except Exception as e:
                print "Variable save, can't get dimension: {}".format(e)
                self.saved_dimensions = None

        return super(Variable, self).save(*args, **kwargs)

    def __unicode__(self):
        return self.name

    @cached_property
    def dimensions(self):
        return self.root.dimensions

    def tree_json(self):
        return json.dumps(self.tree)

    def input_variables_json(self):
        return json.dumps(self.input_variables)

    def get_layers(self):
        return self.root.get_layers()

    def get_rasters(self):
        return self.root.get_rasters()

    def data(self):
        if self.current_data is None:
            self.current_data = self.root.execute()

        return self.current_data


class RasterRequest(models.Model):
    raster_id = models.CharField(max_length=512)
    dates = models.CharField(max_length=512)
    vector = models.ForeignKey(Layer)
    job_id = models.CharField(max_length=512)
    status = models.IntegerField(
        choices=((0, 'Good'), (1, 'Working'), (3, 'Bad')), default=1
    )

    class Meta:
        unique_together = ('raster_id', 'dates', 'vector',)

from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField
from django.utils.functional import cached_property

from wagtail.wagtailcore.models import Page

from geokit_tables.models import GeoKitTable
from layers.models import Layer
from data import treeToNode, wrapJoins, wrapRasters, new_rpc_con
import json


class Variable(models.Model):
    name = models.SlugField(max_length=75, blank=False)
    description = models.TextField(null=True, blank=True)
    temporal_domain = ArrayField(models.DateField(), null=True, blank=True)
    spatial_domain = models.ForeignKey(Layer, null=True, blank=True)
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
        if not self.tree:
            return None
        else:
            return treeToNode(self.tree)

    def __init__(self, *args, **kwargs):
        super(Variable, self).__init__(*args, **kwargs)
        self.source_layers = None
        self.current_data = None

    def save(self, *args, **kwargs):
        if self.tree:
            self.tree = wrapJoins(self.tree)
            self.tree = wrapRasters(self.tree)
            try:
                self.saved_dimensions = self.root.dimensions
            except Exception as e:
                print "Variable save, can't get dimension: {}".format(e)
                self.saved_dimensions = None

        return super(Variable, self).save(*args, **kwargs)

    def __unicode__(self):
        if self.saved_dimensions is None:
            return self.name
        return "{} {}{}".format(
            self.name,
            'S' if 's' in self.saved_dimensions else '',
            'T' if 't' in self.saved_dimensions else ''
        )

    @cached_property
    def dimensions(self):
        return self.root.dimensions

    @cached_property
    def units(self):
        '''
        For now, assume that there is only one raster product, use its units.

        TODO: Add `units` property to DataNode, do unit math to combine units
        of all sources.
        '''
        rasters = self.get_rasters()

        if not rasters:
            return None

        conn = new_rpc_con()
        catalog = conn.get_catalog()
        raster = list(rasters)[0].raster
        units = [p['units'] for p in catalog if p['name'] == raster['id']][0]

        return units

    def tree_json(self):
        return json.dumps(self.tree)

    def input_variables_json(self):
        return json.dumps(self.input_variables)

    def get_layers(self):
        return Layer.objects.filter(pk__in=self.root.get_layers())

    def get_tables(self):
        return GeoKitTable.objects.filter(pk__in=self.root.get_tables())

    def get_rasters(self):
        return self.root.get_rasters()

    def get_pages(self):
        dependent_pages = set()

        for page in Page.objects.all():
            if page not in dependent_pages:
                page_revision = page.get_latest_revision()
                if page_revision:
                    page_content = json.loads(page_revision.content_json)
                    page_body = json.loads(page_content['body'])

                    for block in page_body:
                        if block['type'] == 'visualization':
                            for vis in block['value']['visualizations']:
                                if vis['variable'] == self.pk:
                                    dependent_pages.add(page)

        return dependent_pages

    @cached_property
    def bounds(self):
        layer_ids = self.root.get_layers()
        boxes = list(Layer.objects.filter(pk__in=layer_ids).values('bounds'))

        if any(boxes):
            lon_min = min([b['bounds'][0] for b in boxes])
            lat_max = max([b['bounds'][1] for b in boxes])
            lon_max = max([b['bounds'][2] for b in boxes])
            lat_min = min([b['bounds'][3] for b in boxes])
        else:
            return None

        class blist(list):
            def __unicode__(self):
                return ", ".join(map(lambda x: "{:.4f}".format(x), self))

        return blist([lon_min, lat_max, lon_max, lat_min])

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

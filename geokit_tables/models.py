from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import DateRangeField, JSONField


class GeoKitTable(models.Model):
    name = models.SlugField(primary_key=True, max_length=250)
    description = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)

    def __unicode__(self):
        return self.name


class Record(models.Model):
    table = models.ForeignKey(GeoKitTable)
    date = DateRangeField()
    properties = JSONField(null=True)

    def __unicode__(self):
        return self.pk

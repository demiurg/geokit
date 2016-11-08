from __future__ import unicode_literals

from django.db import models
from django.contrib.postgres.fields import DateRangeField, JSONField, ArrayField


class GeoKitTable(models.Model):
    """Metadata for a particular table of time-series data.

    Actual data is kept in Record objects."""
    name = models.SlugField(max_length=250, unique=True)
    description = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)
    field_names = ArrayField(models.TextField(), null=True)

    def __unicode__(self):
        return self.name


class Record(models.Model):
    """A particular span of time and associated data.

    The data may contain feature IDs to associate that data with particular
    geospatial data, eg a particular NH county.  The data can be arbitrarily
    complex.  For instance, weather observations for a given week, which could
    include mean high temperature, mean cloud cover, and total precipitation.
    """
    table = models.ForeignKey(GeoKitTable)
    date = models.DateField(null=True)
    properties = JSONField(null=True)

    def __unicode__(self):
        """Explicitly convert primary key to unicode & return it."""
        return unicode(self.pk)

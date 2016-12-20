from __future__ import unicode_literals

import csv
import os

from django.db import connection, IntegrityError, models
from django.conf import settings
from django.contrib.postgres.fields import DateRangeField, JSONField, ArrayField


class GeoKitTable(models.Model):
    """Metadata for a particular table of time-series data.

    Actual data is kept in Record objects."""
    name = models.SlugField(max_length=250, unique=True)
    description = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)
    field_names = ArrayField(models.TextField(), null=True)
    # http://toblerity.org/fiona/manual.html#keeping-schemas-simple
    schema = JSONField(null=True)
    status = models.IntegerField(
        choices=((0, 'Good'), (1, 'Working'), (3, 'Bad')), default=1
    )

    def export_to_file(self, tenant):
        connection.close()
        connection.set_schema(tenant)

        try:
            table_file = GeoKitTableFile(table=self)
            table_file.save()

            path = "%s/downloads/csv/%s/%s" % (
                settings.MEDIA_ROOT, tenant, self.pk
            )

            if not os.path.exists(os.path.dirname(path)):
                os.makedirs(os.path.dirname(path))

            with open(path + '.csv', 'w') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.field_names)

                writer.writeheader()
                for r in self.record_set.all():
                    writer.writerow(r.properties)

            table_file.file = "downloads/csv/%s/%s.csv" % (tenant, self.pk)
            table_file.save()

        except IntegrityError:
            # Race condition where two requests for a GeoKitTable
            # occur at the same time.
            pass

    def __unicode__(self):
        return self.name


class GeoKitTableFile(models.Model):
    table = models.OneToOneField(GeoKitTable)
    file = models.FileField(null=True, blank=True)

    def __unicode__(self):
        return unicode(self.pk)


class Record(models.Model):
    """A particular span of time and associated data.

    The data may contain feature IDs to associate that data with particular
    geospatial data, eg a particular NH county.  The data can be arbitrarily
    complex.  For instance, weather observations for a given week, which could
    include mean high temperature, mean cloud cover, and total precipitation.
    """
    table = models.ForeignKey(GeoKitTable)
    date_range = DateRangeField(null=True)
    properties = JSONField(null=True)

    def __unicode__(self):
        """Explicitly convert primary key to unicode & return it."""
        return unicode(self.pk)

    def date(self):
        return self.date_range.lower

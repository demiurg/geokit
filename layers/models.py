from datetime import datetime
from glob import glob
import json
import md5
import os
from zipfile import ZipFile

import fiona
from fiona.crs import from_string

from django.conf import settings
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField, JSONField
from django.db import connection, IntegrityError
from django.utils.text import slugify


class Layer(models.Model):
    name = models.SlugField(
        unique=True, max_length=250,
        help_text=(
            'The name of the layer as it will appear in URLs '
            'e.g http://domain.com/blog/my-slug/ and '
            'expressions e.g map(my-slug)'
        )
    )
    bounds = ArrayField(models.FloatField(), size=4, null=True)
    field_names = ArrayField(models.TextField(), null=True)
    # http://toblerity.org/fiona/manual.html#keeping-schemas-simple
    schema = JSONField(null=True)
    description = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)
    status = models.IntegerField(
        choices=((0, 'Good'), (1, 'Working'), (3, 'Bad')), default=1
    )

    def mapnik_query(self):
        return """(
            SELECT
                ST_CollectionExtract(geometry, 1) AS geometry,
                id AS id
            FROM layers_feature
            WHERE layer_id = '{0}'
            UNION
            SELECT
                ST_CollectionExtract(geometry, 2) AS geometry,
                id AS id
            FROM layers_feature
            WHERE layer_id = '{0}'
            UNION
            SELECT
                ST_CollectionExtract(geometry, 3) AS geometry,
                id AS id
            FROM layers_feature
            WHERE layer_id = '{0}'
        ) as extr""".format(self.name)

    def query_hash(self):
        return md5.md5(self.mapnik_query()).hexdigest()

    def export_to_file(self, tenant):
        connection.close()
        connection.set_schema(tenant)

        try:
            layer_file = LayerFile(layer=self)
            layer_file.save()

            filename = slugify(self.name + str(datetime.now()))
            path = "%s/downloads/shapefile/%s/%s" % (
                settings.MEDIA_ROOT, tenant, filename
            )
            crs = from_string(self.feature_set.first().geometry.crs.proj4)

            if not os.path.exists(os.path.dirname(path)):
                os.makedirs(os.path.dirname(path))
            with fiona.open(
                path + '.shp',
                'w',
                driver='ESRI Shapefile',
                schema=self.schema,
                crs=crs
            ) as out:
                for feature in self.feature_set.all():
                    properties = feature.properties
                    try:
                        del properties['fid']
                    except:
                        pass

                    if self.schema['geometry'] == 'GeometryCollection':
                        geometry = json.loads(feature.geometry.json)
                    else:
                        geometry = json.loads(feature.geometry.json)['geometries'][0]

                    out.write({
                        'geometry': geometry,
                        'properties': feature.properties,
                    })

            os.chdir(os.path.dirname(path))
            with ZipFile(path + '.zip', 'w') as shape_zip:
                for f in glob('%s.*' % filename):
                    if not os.path.basename(f).endswith('zip'):
                        shape_zip.write(f)

            layer_file.file = "downloads/shapefile/%s/%s.zip" % (tenant, filename)
            layer_file.save()
            return layer_file
        except IntegrityError as e:
            # Race condition where two requests for a LayerFile
            # occur at the same time.
            return LayerFile.objects.get(layer=self)

    def __str__(self):
        return self.name


class LayerFile(models.Model):
    layer = models.OneToOneField(Layer)
    file = models.FileField(null=True, blank=True)

    def __unicode__(self):
        return unicode(self.pk)


class Feature(models.Model):
    layer = models.ForeignKey(Layer)
    geometry = models.GeometryCollectionField(srid=3857)
    properties = JSONField(null=True)

    @property
    def verbose_name(self):
        if self.properties.has_key('name'):
            return self.properties['name']
        elif self.properties.has_key('NAME'):
            return self.properties['NAME']
        else:
            return self.properties['fid']

    def __unicode__(self):
        return unicode(self.pk)

import md5

from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField, JSONField


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

    def __str__(self):
        return self.name


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

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from variables.models import Variable, RasterRequest
from variables.data import rpc_con
from layers.models import Layer, LayerFile

import django_rq
import os
from django.db import connection
from django.conf import settings


class VariableSerializer(serializers.HyperlinkedModelSerializer):

    name = serializers.CharField(
        max_length=75,
        validators=[UniqueValidator(queryset=Variable.objects.all())]
    )

    class Meta:
        model = Variable
        fields = '__all__'
        extra_kwargs = {
            'name': {
                'read_only': False,
                'required': True,
            },
            'partial': True
        }

    def update(self, *args, **kwargs):
        result = super(VariableSerializer, self).update(*args, **kwargs)
        django_rq.enqueue(
            process_rasters,
            self.instance.pk,
            self.context['request'].tenant.schema_name
        )
        return result

    def create(self, *args, **kwargs):
        result = super(VariableSerializer, self).create(*args, **kwargs)
        django_rq.enqueue(
            process_rasters,
            result.pk,
            self.context['request'].tenant.schema_name
        )
        return result


class RasterRequestSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = RasterRequest
        fields = '__all__'


def process_rasters(variable_pk, schema_name):
    connection.close()
    connection.set_schema(schema_name)

    variable = Variable.objects.get(pk=variable_pk)

    rasters = variable.get_rasters()
    for r in rasters:
        vector = r.get_layers().pop()
        try:
            job_request = RasterRequest.objects.get(
                raster_id=r.raster['id'],
                dates=r.dates,
                vector=vector
            )
        except RasterRequest.DoesNotExist:
            job_request = RasterRequest(
                raster_id=r.raster['id'],
                dates=r.dates,
                vector=vector
            )

            layer_file = vector.export_to_file(schema_name)

            shp_file = "{}/{}.shp".format(
                settings.MEDIA_ROOT, str(layer_file.file)[:-4]
            )
            if (
                layer_file.status in ('finished', None) 
                and os.path.isfile(shp_file)
            ):
                job_id = rpc_con().submit_job(
                    schema_name,
                    r.raster['id'],
                    {"site": shp_file},
                    {"dates": r.dates}
                )

                job_request.job_id = job_id
                job_request.save()
            else:
                # how to handle?
                print 'Problem getting layer shapefile'

from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from variables.models import Variable, RasterRequest

import django_rq
from django.db import connection, connections, transaction


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

    def update(self, request):
        result = super(VariableSerializer, self).create(request)
        django_rq.enqueue(
            process_rasters, self.instance,
            self.request.tenant.schema_name
        )
        return result

    def create(self, request):
        result = super(VariableSerializer, self).create(request)
        django_rq.enqueue(process_rasters, self.instance)
        return result


class RasterRequestSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = RasterRequest
        fields = '__all__'


def process_rasters(variable, schema_name):
    connection.close()
    connection.set_schema(schema_name)

    rasters = variable.get_rasters()
    for r in rasters:
        print r

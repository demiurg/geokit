from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from variables.models import Variable


class VariableSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Variable
        fields = '__all__'
        extra_kwargs = {
            'name': {
                'read_only': True
            },
            'partial': True
        }

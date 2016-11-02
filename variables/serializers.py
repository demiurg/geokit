from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from variables.models import Variable


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

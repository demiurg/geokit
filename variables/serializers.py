from rest_framework import serializers

from variables.models import Variable


class VariableSerializer(serializers.HyperlinkedModelSerializer):
    data_source = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Variable
        fields = '__all__'

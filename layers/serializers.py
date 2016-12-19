from rest_framework import serializers

from layers.models import Feature, Layer, LayerFile


class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = '__all__'


class LayerFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LayerFile
        fields = '__all__'


class LayerSerializer(serializers.ModelSerializer):
    layer_file = serializers.SerializerMethodField()

    def get_layer_file(self, obj):
        try:
            data = LayerFileSerializer(obj.layerfile).data
        except LayerFile.DoesNotExist:
            data = None
        return data

    class Meta:
        model = Layer
        fields = '__all__'

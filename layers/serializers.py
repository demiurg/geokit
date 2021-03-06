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
    feature_count = serializers.SerializerMethodField()

    def get_layer_file(self, obj):
        try:
            data = LayerFileSerializer(obj.layerfile_set.all().last()).data
        except LayerFile.DoesNotExist:
            data = None
        return data

    def get_feature_count(self, obj):
        return obj.feature_set.count()

    class Meta:
        model = Layer
        fields = '__all__'

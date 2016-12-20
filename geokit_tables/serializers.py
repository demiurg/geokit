from rest_framework import serializers

from .models import GeoKitTable, GeoKitTableFile, Record


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = '__all__'


class GeoKitTableFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoKitTableFile
        fields = '__all__'


class GeoKitTableSerializer(serializers.ModelSerializer):
    table_file = serializers.SerializerMethodField()

    def get_table_file(self, obj):
        try:
            data = GeoKitTableFileSerializer(obj.geokittablefile).data
        except GeoKitTableFile.DoesNotExist:
            data = None
        return data

    class Meta:
        model = GeoKitTable
        fields = '__all__'

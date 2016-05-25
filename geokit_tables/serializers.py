from rest_framework import serializers

from .models import GeoKitTable, Record


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = '__all__'


class GeoKitTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = GeoKitTable
        fields = '__all__'

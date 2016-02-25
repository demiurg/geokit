from dateutil.parser import parse

from psycopg2.extras import DateRange
from rest_framework import serializers

from expressions.models import Expression, FormVariable


class FormVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVariable
        fields = ('name', 'value', 'user')


class DateRangeField(serializers.Field):
    def to_representation(self, obj):
        print obj
        return {'start': obj.lower.isoformat(), 'end': obj.upper.isoformat()}

    def to_internal_value(self, data):
        print data
        if not data['start'] or not data['end']:
            return None
        else:
            return DateRange(lower=parse(data['start']).date(), upper=parse(data['end']).date())


class ExpressionSerializer(serializers.HyperlinkedModelSerializer):
    temporal_domain = DateRangeField()

    class Meta:
        model = Expression
        fields = '__all__'

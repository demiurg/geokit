from rest_framework import serializers

from expressions.models import Expression, FormVariable


class FormVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormVariable
        fields = ('name', 'value', 'user')


class ExpressionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expression
        fields = '__all__'

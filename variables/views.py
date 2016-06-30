import json

from django.shortcuts import get_object_or_404, render

from rest_framework import viewsets, status
from rest_framework.response import Response

from expressions.models import Expression
from expressions.serializers import ExpressionSerializer
from variables.models import Variable, ExpressionDataSource
from variables.serializers import VariableSerializer


def index(request):
    expressions = Expression.objects.all()
    return render(request, 'variables/index.html', {"expressions": expressions})


def add(request):
    return render(request, 'variables/sieve.html')


def edit(request, expression_id):
    expression = get_object_or_404(Expression, pk=expression_id)
    filters = json.dumps(expression.filters)
    return render(request, 'variables/sieve.html', {
        'expression': expression,
        'filters': filters,
    })


class VariableViewSet(viewsets.ModelViewSet):
    queryset = Variable.objects.all()
    serializer_class = VariableSerializer

    def create(self, request):
        expression_serializer = ExpressionSerializer(data=request.data)
        expression_serializer.is_valid(raise_exception=True)
        expression = expression_serializer.save()

        ds = ExpressionDataSource(expression=expression)
        ds.save()

        d = request.data
        variable = Variable(
            name=d['name'],
            temporal_domain=d['temporal_domain'],
            spatial_domain=[],   # temporarily unimplemented
            units='',            # temporarily unimplemented
            data_source=ds
        )
        variable.save()
        serializer = VariableSerializer(variable, context={'request': request})

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=self.get_success_headers(serializer.data))

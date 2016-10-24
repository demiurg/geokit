import json

from django.shortcuts import get_object_or_404, render

from rest_framework import viewsets, status
from rest_framework.response import Response

from variables.models import Variable
from variables.serializers import VariableSerializer


def index(request):
    variables = Variable.objects.all()
    return render(request, 'variables/index.html', {"variables": variables})


def add(request):
    return render(request, 'variables/sieve.html')


def edit(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)
    return render(request, 'variables/sieve.html', {
        'variable': variable
    })


class VariableViewSet(viewsets.ModelViewSet):
    queryset = Variable.objects.all()
    serializer_class = VariableSerializer

    #def create(self, request):
        #expression_serializer = ExpressionSerializer(data=request.data)
        #expression_serializer.is_valid(raise_exception=True)
        #expression = expression_serializer.save()

        #ds = ExpressionDataSource(expression=expression)
        #ds.save()

        #d = request.data
        #variable = Variable(
            #name=d['name'],
            #temporal_domain=d['temporal_domain'],
            #spatial_domain=[],   # temporarily unimplemented
            #units='',            # temporarily unimplemented
            #data_source=ds
        #)
        #variable.save()
        #serializer = VariableSerializer(variable, context={'request': request})

        #return Response(serializer.data, status=status.HTTP_201_CREATED, headers=self.get_success_headers(serializer.data))

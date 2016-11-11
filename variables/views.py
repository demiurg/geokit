import json

from django.core.serializers import serialize
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from rest_framework import viewsets, status
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from layers.models import Feature
from variables.models import Variable
from variables.serializers import VariableSerializer

import random
from django.core import serializers


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

    def map_test_data(self, variable):
        features = Feature.objects.all()[:10]
        data = json.loads(serializers.serialize("geojson", features))['features']

        random.seed()
        for feature in data:
            feature['properties'][variable.name] = random.randint(0, 100)

        return data

    @detail_route(url_path='map')
    def map_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        return Response(self.map_test_data(variable))  # FOR TESTING MAP DURING DEVELOPMENT ONLY; DELETE!

        evaluated_variable = variable.data()

        values = evaluated_variable['values']
        data = []

        rows, cols = values.shape
        if cols == 1:
            features = Feature.objects.filter(pk__in=evaluated_variable['spatial_key'])

            for i, value in enumerate(values):
                geometries = [feature for feature in features if feature.pk == evaluated_variable['spatial_key'][i]]
                geojson = json.loads(serialize('geojson', geometries, fields=('geometry')))
                geojson['features'][0]['properties'][variable.name] = value[0]

                data.append(geojson['features'][0])

        return Response(data)

    @detail_route(url_path='graph')
    def graph_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)
        evaluated_variable = variable.data()

        data = {'x': [], 'y': []}

        rows, cols = evaluated_variable['values'].shape
        if rows == 1:
            # Build timeseries
            data['type'] = 'timeseries'
            data['mode'] = 'lines'
            for i, value in enumerate(evaluated_variable['values'][0]):
                date = evaluated_variable['temporal_key'][i]
                data['x'].append(date.strftime("%Y-%m-%d %H:%M:%S"))
                data['y'].append(value)
        elif cols == 1:
            # Build scatterplot by location
            features = list(Feature.objects.filter(pk__in=evaluated_variable['spatial_key']))

            data['type'] = 'scatter'
            data['mode'] = 'markers'
            for i, value in enumerate(evaluated_variable['values']):
                f = [feature for feature in features if feature.pk == evaluated_variable['spatial_key'][i]][0]
                data['x'].append(f.verbose_name)
                data['y'].append(value[0])
        else:
            data['invalid'] = True

        return Response(data)

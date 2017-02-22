from django.core.serializers import serialize
from django.shortcuts import get_object_or_404, render
from django.conf import settings

from rest_framework import viewsets
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from layers.models import Feature
from variables.models import Variable
from variables.serializers import VariableSerializer
from variables.data import NODE_TYPES

import json
import xmlrpclib


def get_raster_catalog():
    if not hasattr(settings, 'RPC_URL'):
        print "Error: RPC_URL must be set in settings.py"
        return None

    conn = xmlrpclib.ServerProxy(settings.RPC_URL)

    data = conn.get_datacatalog()
    return data


def index(request):
    variables = Variable.objects.all()
    return render(request, 'variables/index.html', {"variables": variables})


def add(request):
    raster_catalog = get_raster_catalog()
    return render(request, 'variables/sieve.html', {
        'raster_catalog': json.dumps(raster_catalog),
        'node_types': json.dumps(NODE_TYPES.keys())
    })


def edit(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)

    raster_catalog = get_raster_catalog()
    return render(request, 'variables/sieve.html', {
        'variable': variable,
        'raster_catalog': json.dumps(raster_catalog),
        'node_types': json.dumps(NODE_TYPES.keys())
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

    @detail_route(url_path='map')
    def map_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        evaluated_variable = variable.data()

        data = []

        if 'space' in variable.dimensions():
            features = Feature.objects.filter(pk__in=evaluated_variable.index)

            for i, value in enumerate(evaluated_variable):
                geometries = [feature for feature in features if feature.pk == evaluated_variable.index[i]]
                geojson = json.loads(serialize('geojson', geometries, fields=('geometry')))
                geojson['features'][0]['properties'][variable.name] = value

                data.append(geojson['features'][0])

        return Response(data)

    @detail_route(url_path='graph')
    def graph_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        df = variable.data()

        data = {'x': [], 'y': []}

        try:
            dim = variable.dimensions()
            if 'space' in dim:
                # Build scatterplot by location
                features = list(
                    Feature.objects.filter(pk__in=df.index).defer('geometry')
                )

                data['type'] = 'scatter'
                data['mode'] = 'markers'
                for i, value in enumerate(df.values):
                    f = [feature for feature in features if feature.pk == df.index[i]][0]
                    data['x'].append(f.verbose_name)
                    data['y'].append(value)
            elif 'time' in dim:
                # Build timeseries
                data['type'] = 'scatter'
                data['mode'] = 'lines'
                for i, value in enumerate(df.values):
                    date = df.index[i].lower
                    data['x'].append(date.strftime("%Y-%m-%d %H:%M:%S"))
                    data['y'].append(value)
            else:
                data['invalid'] = True
        except Exception as e:
            print e
            data['invalid'] = True

        return Response(data)

    @detail_route(url_path='table')
    def table_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        df = variable.data()
        data = {}
        dim = variable.dimensions()
        if 'time' in dim:
            data['dimension'] = 'time'
            data['values'] = []
            for i, value in enumerate(df.values):
                date = df.index[i].lower
                data['values'].append({'date': date.strftime("%Y-%m-%d"), 'value': value})

        elif 'space' in dim:
            features = list(
                Feature.objects.filter(pk__in=df.index).defer('geometry')
            )

            data['dimension'] = 'space'
            data['values'] = []
            for i, value in enumerate(df.values):
                f = [feature for feature in features if feature.pk == df.index[i]][0]
                f.geometry.transform(4326)
                feature = {}
                feature['geometry'] = json.loads(f.geometry.geojson)
                feature['type'] = 'Feature'
                feature['properties'] = {}
                feature['properties']['name'] = f.verbose_name
                feature['properties']['id'] = f.pk
                data['values'].append({'feature': feature, 'value': value})
        else:
            # Can't handle this presently...
            data['invalid'] = True

        return Response(data)

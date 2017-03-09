from django.core.serializers import serialize
from django.shortcuts import get_object_or_404, render
from django.conf import settings
from django.http import HttpResponse

from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from layers.models import Feature
from variables.models import Variable, RasterRequest
from variables.serializers import VariableSerializer, RasterRequestSerializer
from variables.data import NODE_TYPES

import json
import xmlrpclib
import pandas
from psycopg2.extras import DateRange


def get_raster_catalog():
    if not hasattr(settings, 'RPC_URL'):
        print "Error: RPC_URL must be set in settings.py"
        return None

    conn = xmlrpclib.ServerProxy(settings.RPC_URL)

    data = conn.get_datacatalog()
    return data


def index(request):
    variables = Variable.objects.all().order_by('-modified')
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


def map_json(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)

    data_frame = variable.data()

    text = '{"dimensions": "' + variable.dimensions + '", '

    if "space" in variable.dimensions:
        layers = variable.get_layers()
        map(lambda l: l.refresh_from_db(), layers)
        text += '"layers": [' + ','.join(map(lambda l: str(l.pk), layers)) + '], '
        text += '"bounds": [' + ','.join(map(lambda l: str(l.bounds), layers)) + '], '
        text += '"data": {'
        for shaid, row in data_frame.iterrows():
            text += '"' + shaid + '": {'
            for column, value in row.iteritems():
                if "time" in variable.dimensions and type(column) == DateRange:
                    column = str(column.lower)
                else:
                    column = variable.name
                text += '"{}": {},'.format(column, value)
            text = text[:-1]
            text += '},'
        text = text[:-1]
        text += "}"
    text += "}"
    return HttpResponse(text)


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.variable.owner == request.user


class RasterRequestViewSet(viewsets.ModelViewSet):
    queryset = RasterRequest.objects.all()
    serializer_class = RasterRequestSerializer
    permission_classes = (IsOwnerOrReadOnly,)


class VariableViewSet(viewsets.ModelViewSet):
    queryset = Variable.objects.all()
    serializer_class = VariableSerializer

    @detail_route(url_path='graph')
    def graph_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        df = variable.data()

        data = {'x': [], 'y': []}

        try:
            dim = variable.dimensions
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
        dim = variable.dimensions
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

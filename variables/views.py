from django.core.serializers import serialize
from django.shortcuts import get_object_or_404, render
from django.conf import settings
from django.http import HttpResponse

from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from layers.models import Feature, Layer
from variables.models import Variable, RasterRequest
from variables.serializers import VariableSerializer, RasterRequestSerializer
from variables.data import NODE_TYPES

import json
import xmlrpclib
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


def data_json(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)

    data_frame = variable.data()

    text = '{"dimensions": "' + variable.dimensions + '", '

    if "space" in variable.dimensions:
        layers = variable.get_layers()
        layers = Layer.objects.filter(pk__in=layers)
        text += '"layers": [' + ','.join(map(lambda l: str(l.pk), layers)) + '], '
        text += '"bounds": [' + ','.join(map(lambda l: str(l.bounds), layers)) + '], '
        text += '"data": {'
        if hasattr(data_frame, 'iterrows'):
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
        else:
            for shaid, item in data_frame.iteritems():
                text += '"' + shaid + '": {'
                text += '"{}": {}'.format(variable.name, item)
                text += '},'
        text = text[:-1]
        text += "}"
    elif "time" == variable.dimensions:
        text += '"data": {'
        if hasattr(data_frame, 'iterrows'):
            iterable = data_frame.iterrows()
        elif hasattr(data_frame, 'iteritems'):
            iterable = data_frame.iteritems()

        for daterange, value in iterable:
            text += '"' + str(daterange.lower) + '": ' + str(value) + ','

        text = text[:-1]
        text += '},'

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
                    Feature.objects.filter(
                        properties__shaid__in=df.index
                    ).defer('geometry')
                )
                names = {f.properties['shaid']: f.verbose_name for f in features}

                data['type'] = 'scatter'
                data['mode'] = 'markers'
                for i, value in enumerate(df.values):
                    data['x'].append(names[df.index[i]])
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

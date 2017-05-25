from django.shortcuts import get_object_or_404, render, redirect
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse

from rest_framework import viewsets, permissions
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from wagtail.wagtailadmin import messages

from variables.models import Variable, RasterRequest
from variables.serializers import VariableSerializer, RasterRequestSerializer
from variables.data import NODE_TYPES, JobIncompleteException, rpc_con

from django.core.serializers.json import DjangoJSONEncoder
from django.utils.functional import curry
from datetime import date, timedelta
import json
from psycopg2.extras import DateRange
from numpy import isnan

json.dumps = curry(json.dumps, cls=DjangoJSONEncoder)


def get_raster_catalog():
    if not hasattr(settings, 'RPC_URL'):
        print "Error: RPC_URL must be set in settings.py"

    try:
        conn = rpc_con()
        data = conn.get_catalog()

        if not data:
            return []

        for r in data:
            r['start_date'] = r['start_date'].date()
            r['end_date'] = date.today() - timedelta(days=r['latency'])
        return data
    except Exception as e:
        print "Error getting raster catalog: {}".format(str(e))

    return None


def get_raster_status(variable):
    statuses = {}
    from variables.data import new_rpc_con
    conn = new_rpc_con()
    for r in variable.rasters:
        try:
            job_request = RasterRequest.objects.get(
                raster_id=r.raster['id'],
                dates=r.dates,
                vector=r.get_layer()
            )
            statuses[r.raster['id']] = conn.get_status(job_request.job_id)[0]
        except RasterRequest.DoesNotExist:
            statuses[r.raster['id']] = None

    return statuses


def raster_statuses(request):
    variables = Variable.objects.all().order_by('-modified')
    raster_statuses = [get_raster_status(v) for v in variables]
    variables_and_statuses = zip(
        variables.values(), raster_statuses
    )
    return HttpResponse(json.dumps(variables_and_statuses))


def variable_raster_status(request, pk):
    v = Variable.objects.get_object_or_404(pk=pk)
    return HttpResponse(json.dumps(get_raster_status(v)))


def index(request):
    variables = Variable.objects.all().order_by('-modified')
    return render(request, 'variables/index.html', {
        "variables": variables
    })


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


def delete(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)
    variable_name = variable.name

    pages_to_delete = variable.get_pages()

    if request.method == 'POST':
        with transaction.atomic():
            variable.delete()

            for page in pages_to_delete:
                page.delete()

        messages.success(request, "Variable '{0}' deleted".format(variable_name))
        return redirect('variables:index')

    return render(request, 'variables/confirm_delete.html', {
        'variable': variable,
        'pages_to_delete': pages_to_delete
    })


def data_json(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)

    try:
        data_frame = variable.data()
    except JobIncompleteException:
        return HttpResponse('{"status": "incomplete"}')

    text = '{"dimensions": "' + variable.dimensions + '", '

    text += '"units": "' + variable.units + '", '

    if "space" in variable.dimensions:
        layers = variable.get_layers()
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

                    if isnan(value):
                        value = "null"
                    text += '"{}": {},'.format(column, value)
                text = text[:-1]
                text += '},'
        else:
            for shaid, item in data_frame.iteritems():
                text += '"' + shaid + '": {'

                if isnan(item):
                    item = "null"

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
            if isnan(value):
                value = "null"
            text += '"' + str(daterange.lower) + '": ' + str(value) + ','

        text = text[:-1]
        text += '}'

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

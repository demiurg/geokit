from django.core.serializers import serialize
from django.shortcuts import get_object_or_404, render
from django.core import serializers
from django.conf import settings

from rest_framework import viewsets, status
from rest_framework.decorators import detail_route
from rest_framework.response import Response

from layers.models import Feature
from variables.models import Variable
from variables.serializers import VariableSerializer

from datetime import datetime
from dateutil.rrule import rrule, WEEKLY
import json
import random
import numpy
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
    variables = Variable.objects.all()
    return render(request, 'variables/index.html', {"variables": variables})


def add(request):
    rasters = get_raster_catalog()
    return render(request, 'variables/sieve.html', {
        'rasters': rasters,
    })


def edit(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)
    rasters = get_raster_catalog()
    return render(request, 'variables/sieve.html', {
        'variable': variable,
        'rasters': rasters
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

    def graph_test_data(self):
        data = {'x': [], 'y': [], 'type': 'timeseries', 'mode': 'lines'}
        dates = list(rrule(freq=WEEKLY, count=20, dtstart=datetime(2010, 1, 1)))
        data['x'] = [d.strftime("%Y-%m-%d %H:%M:%S") for d in dates]

        random.seed()
        for _ in range(20):
            data['y'].append(random.randint(0, 100))

        return data

    @detail_route(url_path='graph')
    def graph_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        #return Response(self.graph_test_data())

        df = variable.data()

        data = {'x': [], 'y': []}

        try:
            if variable.data_dimensions() == 'space':
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
            elif variable.data_dimensions() == 'time':
                # Build timeseries
                data['type'] = 'timeseries'
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

    def table_test_data(self):
        data = {'dimension': 'time', 'values': []}

        random.seed()
        #for f in Feature.objects.all()[:20]:
            #data['values'].append({'feature': f.verbose_name, 'value': random.randint(0, 100)})
        for d in list(rrule(freq=WEEKLY, count=20, dtstart=datetime(2010, 1, 1))):
            data['values'].append({'date': d.strftime("%Y-%m-%d"), 'value': random.randint(0,100)})

        return data

    @detail_route(url_path='table')
    def table_data(self, request, pk=None):
        variable = get_object_or_404(Variable, pk=pk)

        #return Response(self.table_test_data())

        df = variable.data()
        data = {}

        if variable.data_dimensions() == 'time':
            data['dimension'] = 'time'
            data['values'] = []
            for i, value in enumerate(df.values):
                date = df.index[i].lower
                data['values'].append({'date': date.strftime("%Y-%m-%d"), 'value': value})

        elif variable.data_dimensions() == 'space':
            features = list(
                Feature.objects.filter(pk__in=df.index).defer('geometry')
            )

            data['dimension'] = 'space'
            data['values'] = []
            for i, value in enumerate(df.values):
                f = [feature for feature in features if feature.pk == df.index[i]][0]
                data['values'].append({'feature': f.verbose_name, 'value': value})
        else:
            # Can't handle this presently...
            data['invalid'] = True

        return Response(data)



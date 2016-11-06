import json

from django.core.serializers import serialize
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render

from rest_framework import viewsets, status
from rest_framework.response import Response

from layers.models import Feature
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


def map_data(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)
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

    return JsonResponse(data)


def graph_data(request, variable_id):
    variable = get_object_or_404(Variable, pk=variable_id)
    evaluated_variable = variable.data()

    data = {'values': []}

    rows, cols = evaluated_variable['values'].shape
    if rows == 1:
        # Build timeseries
        data['timeseries'] = True
        for i, value in enumerate(evaluated_variable['values'][0]):
            date = evaluated_variable['temporal_key'][i]
            data['values'].append({
                'date': date.strftime("%Y-%m-%d %H:%M:%S"),
                'value': value
            })
    elif cols == 1:
        # Build scatterplot by location
        features = list(Feature.objects.filter(pk__in=evaluated_variable['spatial_key']).values())

        data['scatter'] = True
        for i, value in enumerate(evaluated_variable['values']):
            metadata = [feature for feature in features if feature['id'] == evaluated_variable['spatial_key'][i]][0]
            del metadata['geometry']
            data['values'].append({
                'location_id': evaluated_variable['spatial_key'][i],
                'metadata': metadata,
                'value': value[0]
            })
    else:
        data['invalid'] = True

    return JsonResponse(data)


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

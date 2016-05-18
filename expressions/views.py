import json

from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404

from wagtail.wagtailadmin import messages
from wagtail.wagtailadmin.modal_workflow import render_modal_workflow

from rest_framework import viewsets

from expressions.models import Expression, FormVariable
from expressions.serializers import ExpressionSerializer, FormVariableSerializer
from layers.views import tile_json


def index(request):
    expressions = Expression.objects.all()
    return render(request, 'expressions/index.html', {
        'expressions': expressions,
    })


def delete(request, expression_id):
    expression = get_object_or_404(Expression, pk=expression_id)

    expression.delete()

    messages.success(request, "Expression '{0}' deleted".format(expression.name))
    return redirect('expressions:index')


def evaluate_on_table(request, expression_id, columns):
    '''
    Expression must return a collection of Features.
    '''
    expression = get_object_or_404(Expression, pk=expression_id)
    columns_parsed = [column.strip() for column in columns.split(',')]

    features = expression.evaluate(request.user)
    result = []
    for feature in features:
        row = {'pk': feature.pk}
        for column in columns_parsed:
            row[column] = feature.properties[column]
        result.append(row)

    return JsonResponse({'result': result})


def evaluate_on_tile(request, layer_name, z, x, y, expression_id):
    tile_response = tile_json(request, layer_name, z, x, y)
    tile = json.loads(tile_response.content)

    expression_result = Expression.objects.get(pk=expression_id).evaluate(request.user)
    if expression_result.vals.shape[1] != 1:
        raise TypeError  # No timeseries data yet

    for feature in tile['features']:
        try:
            val_index = expression_result.spatial_key.index([int(feature['properties']['id'])])
            patch_val = expression_result.vals[val_index]
            feature['properties']['patchVal'] = float(patch_val)
        except ValueError:
            feature['properties']['patchVal'] = None

    return JsonResponse(tile)


def chooser(request):
    expressions = Expression.objects.all()

    return render_modal_workflow(request, 'expressions/chooser.html', 'expressions/chooser.js', {
        'expressions': expressions,
        'isSearching': False,
    })


def expression_chosen(request, expression_id):
    expression = get_object_or_404(Expression, id=expression_id)
    return render_modal_workflow(
        request, None, 'expressions/expression_chosen.js',
        {'expression_json': json.dumps({'id': expression.id, 'name': expression.name, 'expression_text': expression.expression_text})}
    )


# rest_framework ViewSets

class FormVariableViewSet(viewsets.ModelViewSet):
    queryset = FormVariable.objects.all()
    serializer_class = FormVariableSerializer


class ExpressionViewSet(viewsets.ModelViewSet):
    queryset = Expression.objects.all()
    serializer_class = ExpressionSerializer

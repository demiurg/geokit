import json

from django.core.urlresolvers import reverse
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404

from wagtail.wagtailadmin import messages
from wagtail.wagtailadmin.modal_workflow import render_modal_workflow

from rest_framework import viewsets

from expressions.forms import ExpressionForm
from expressions.models import Expression, FormVariable
from expressions.serializers import ExpressionSerializer, FormVariableSerializer
from layers.views import tile_json


def index(request):
    expressions = Expression.objects.all()
    return render(request, 'expressions/index.html', {
        'expressions': expressions,
    })


def add(request):
    if request.method == 'POST':
        form = ExpressionForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(request, "Expression added.")
            return redirect('expressions:index')
        else:
            messages.error(request, "The expression could not be saved due to errors.")
    else:
        form = ExpressionForm()

    return render(request, 'expressions/add.html', {'form': form})


def edit(request, expression_id):
    expression = get_object_or_404(Expression, pk=expression_id)

    if request.POST:
        form = ExpressionForm(request.POST, instance=expression)
        if form.is_valid():
            expression = form.save()

            messages.success(request, "Expression '{0}' updated".format(expression.name), buttons=[
                messages.button(reverse('expressions:edit', args=(expression.pk,)), 'Edit')
            ])
            return redirect('expressions:index')
        else:
            messages.error(request, "The expression could not be saved due to errors.")
    else:
        form = ExpressionForm(instance=expression)

    return render(request, "expressions/edit.html", {
        'expression': expression,
        'form': form
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

    expression = Expression.objects.get(pk=expression_id)
    for feature in tile['features']:
        patch_val = expression.evaluate(request.user, extra_substitutions=feature['properties'])
        feature['properties']['patchVal'] = unicode(patch_val)

    return JsonResponse(tile)


def chooser(request):
    uploadForm = ExpressionForm()
    expressions = Expression.objects.all()

    return render_modal_workflow(request, 'expressions/chooser.html', 'expressions/chooser.js', {
        'expressions': expressions,
        'uploadform': uploadForm,
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

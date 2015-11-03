import json

from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404

from wagtail.wagtailadmin import messages
from wagtail.wagtailadmin.modal_workflow import render_modal_workflow

from expressions.forms import ExpressionForm
from expressions.models import Expression
from layers.models import Feature


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


def evaluate_on_feature(request, expression_id, feature_id):
    expression = get_object_or_404(Expression, id=expression_id)
    feature = get_object_or_404(Feature, id=feature_id)

    result = expression.evaluate(request, extra_substitutions=feature.properties)

    if result == 'undefined':
        return JsonResponse({'result': result})
    return JsonResponse({'result': float(result)})


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

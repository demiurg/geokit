from django.shortcuts import get_object_or_404, render

from expressions.models import Expression


def index(request):
    expressions = Expression.objects.all()
    return render(request, 'variables/index.html', {"expressions": expressions})


def add(request):
    return render(request, 'variables/sieve.html')


def edit(request, expression_id):
    expression = get_object_or_404(Expression, pk=expression_id)
    return render(request, 'variables/sieve.html', {'expression': expression})

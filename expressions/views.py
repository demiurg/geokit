import json
import mimetypes
import urllib2

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404

from wagtail.wagtailadmin import messages
from wagtail.wagtailadmin.modal_workflow import render_modal_workflow

from expressions.forms import ExpressionForm
from expressions.models import Expression
from layers.models import Layer


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


def evaluate_on_tile(request, expression_id, layer_name, z, x, y):
    x, y, z = int(x), int(y), int(z)
    name = Layer.objects.get(name=layer_name).query_hash()
    url = 'http://localhost:{}/{}/{}/{}/{}/expression/{}'.format(settings.NODE_PORT, name, z, x, y, expression_id)
    headers = {
        'Content-Type': request.META['CONTENT_TYPE'],
        'Accept-Encoding': request.META['HTTP_ACCEPT_ENCODING']
    }
    if request.user.is_authenticated():
        headers['X-Django-User-ID'] = request.user.id
    else:
        headers['X-Django-User-ID'] = -1
    
    try:
        request = urllib2.Request(url, headers=headers)
        proxied_request = urllib2.urlopen(request)
        status_code = proxied_request.code
        mimetype = proxied_request.headers.typeheader or mimetypes.guess_type(url)
        content = proxied_request.read()
    except urllib2.HTTPError as e:
        response = HttpResponse(e.msg, status=e.code, content_type='text/plain')
    else:
        response = HttpResponse(content, status=status_code, content_type=mimetype)
        response['Content-Encoding'] = 'deflate'

    return response


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

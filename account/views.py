from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from forms import ExampleForm
from models import GeoKitSite


@ensure_csrf_cookie
def index(request):
    return render(request, 'account/index.html')


@csrf_protect
def availability(request, name):
    name = name.lower()
    available = not GeoKitSite.objects.filter(schema_name=name).exists()
    data = {
        "available": available,
        "site_name": name,
    }
    return JsonResponse(data)

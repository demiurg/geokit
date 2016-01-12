from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from account.forms import ExampleForm
import random


@ensure_csrf_cookie
def index(request):
    example_form = ExampleForm()
    return render(request, 'account/index.html', {'example_form': example_form})


@csrf_protect
def availability(request):
    available = random.choice([True, False])
    data = {
        "available": False,
        "site_name": "",
    }
    if request.method == 'POST':
        data = {
            "available": available,
            "site_name": request.POST.get("search-input", ""),
        }

    return JsonResponse(data)

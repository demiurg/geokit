from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
import random


@ensure_csrf_cookie
def index(request):
    return render(request, 'account/index.html')


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

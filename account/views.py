from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect

@ensure_csrf_cookie
def index(request):
    return render(request, 'account/index.html')

@csrf_protect
def availability(request):
    if request.method == 'POST':
      data = {
        "available": True,
        "site_name": request.POST.get("search-input", ""),
      }
    else:
      available = False

    return JsonResponse(data)
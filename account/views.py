from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User

from forms import SignupForm
from models import GeoKitSite


RESERVED_SITENAMES = [
    'test', 'geokit', 'admin'
]


@ensure_csrf_cookie
def index(request):
    if request.user.is_authenticated():
        return render(request, 'account/home.html')

    return render(request, 'account/landing.html')


def signup(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        password = User.objects.make_random_password()
        u = User.objects.create_user(username=form.cleaned_data['email'],
                                     email=form.cleaned_data['email'],
                                     password=password)
        u.first_name = form.cleaned_data['first_name']
        u.last_name = form.cleaned_data['last_name']
        u.is_active = True

        u.save()

        reset_form = PasswordResetForm({'email': u.email})
        reset_form.is_valid()

        opts = {
            'use_https': request.is_secure(),
            'email_template_name': 'account/signup_confirmation.html',
            'subject_template_name': 'account/signup_confirmation_subject.txt',
            'request': request,
            'extra_email_context': {'password': password },
            # 'html_email_template_name': provide an HTML content template if you desire.
        }
        # This form sends the email on save()
        reset_form.save(**opts)

        return redirect('accounts:home')
    else:
        form = SignupForm()

    return render(request, 'account/signup.html')


def login(request):
    form = SignupForm()
    return render(request, 'account/home.html')


@csrf_protect
def availability(request, name):
    name = name.lower()
    available = name not in RESERVED_SITENAMES and \
        not GeoKitSite.objects.filter(schema_name=name).exists()

    data = {
        "available": available,
        "site_name": name,
    }
    return JsonResponse(data)

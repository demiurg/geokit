from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from django.contrib.auth import login as auth_login, authenticate

from forms import SignupForm, LoginForm
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
        if form.is_valid():
            password = User.objects.make_random_password()
            email = User.objects.normalize_email(form.cleaned_data['email'])
            u = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            u.first_name = form.cleaned_data['first_name']
            u.last_name = form.cleaned_data['last_name']
            u.is_active = True

            u.save()

            reset_form = PasswordResetForm({'email': u.email})
            reset_form.is_valid()

            # https://github.com/django/django/blob/1.9.2/django/contrib/auth/views.py#L187
            opts = {
                'use_https': request.is_secure(),
                'email_template_name': 'account/signup_confirmation.html',
                'subject_template_name': 'account/signup_confirmation_subject.txt',
                'request': request,
                'extra_email_context': {'password': password},
            }
            reset_form.save(**opts)

            return redirect('accounts:home')
    else:
        form = SignupForm()

    return render(request, 'account/form.html', {
        'title': 'Sign up',
        'form': form
    })


def login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            try:
                user = User.objects.get(email=form.cleaned_data['email'])
                if not user.check_password(form.cleaned_data['password']):
                    form.add_error('password', "Password is invalid")
                else:
                    result_user = authenticate(
                        username=user.username,
                        password=form.cleaned_data['password']
                    )
                    if result_user and user.is_active:
                        auth_login(request, result_user)
                    else:
                        form.add_error('password', 'Failed to authenticate.')
            except User.DoesNotExist:
                form.add_error('email', "User does not exist")

    else:
        form = LoginForm()

    return render(request, 'account/form.html', {
        'title': 'Log in',
        'form': form,
    })


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

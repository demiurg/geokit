from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.decorators import login_required

from forms import SignupForm, LoginForm, GeoKitSiteForm
from models import GeoKitSite


@ensure_csrf_cookie
def index(request):
    if request.user.is_authenticated():
        sites = GeoKitSite.objects.filter(user=request.user)

        return render(request, 'account/home.html', {
            "sites": sites
        })

    return render(request, 'account/landing.html')


@login_required
def site_create(request):
    if request.method == 'POST':
        form = GeoKitSiteForm(request.POST)
        if form.is_valid():
            site = form.save(commit=False)
            #site.domain
    else:
        form = GeoKitSiteForm()

    return render(request, 'account/form.html', {
        'title': 'Create Site',
        'form': form
    })


@login_required
def site_edit(request, schema_name):
    site = get_object_or_404(GeoKitSite, schema_name=schema_name)
    if site.user != request.user:
        raise Http404

    if request.method == 'POST':
        form = GeoKitSiteForm(request.POST, instance=site)
        if form.is_valid():
            pass
    else:
        form = GeoKitSiteForm(instance=site)

    return render(request, 'account/form.html', {
        'title': 'Edit Site',
        'form': form
    })


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

            return redirect('home')
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
                        return redirect('home')
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
    available = GeoKitSite.is_available(name)

    data = {
        "available": available,
        "site_name": name,
    }
    return JsonResponse(data)

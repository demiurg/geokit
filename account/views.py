from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth import login as auth_login, authenticate
from django.contrib.auth.decorators import login_required
from django.db import connection

from forms import SignupForm, SignupSiteForm, LoginForm, GeoKitSiteForm
from models import GeoKitSite


@ensure_csrf_cookie
def index(request):
    if request.user.is_authenticated():
        sites = GeoKitSite.objects.filter(user=request.user)

        return render(request, 'account/home.html', {
            "sites": sites
        })
    else:
        form_menu_login = LoginForm(form_action='/login/', no_labels=True, auto_id=False)
        form_menu_signup = SignupForm(form_action='/signup/', no_labels=True, auto_id=False)
        form_body_signup = SignupSiteForm(form_action='/signup/', no_labels=True, auto_id='signup-form')

    return render(request, 'account/landing.html', {
            'form_menu_login': form_menu_login,
            'form_menu_signup': form_menu_signup,
            'form_body_signup': form_body_signup
        }
    )


def site_creator(form, user):
    site = form.save(commit=False)
    site.user = user
    site.domain_url = form.cleaned_data['schema_name'] + '.localhost'
    site.save()

    try:
        CLONE = "SELECT clone_schema('test', '{}', TRUE);".format(site.schema_name)
        cursor = connection.cursor()
        cursor.execute(CLONE)

        site.save()
    except:
        form.add_error("Unknown error occured creating the site.")


@login_required
def site_create(request):
    if request.method == 'POST':
        form = GeoKitSiteForm(request.POST)
        if form.is_valid():
            site_creator(form, request.user)

            return redirect('home')
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
        form = GeoKitSiteForm(request.POST, instance=site, wagtail_submit=True)
        if form.is_valid():
            pass
    else:
        form = GeoKitSiteForm(instance=site, wagtail_submit=True)

    return render(request, 'account/form.html', {
        'site': site,
        'title': 'Edit Site',
        'form': form
    })


def signup(request):
    if request.method == 'POST':
        if request.POST.get('schema_name') and request.POST.get('name'):
            form = SignupSiteForm(request.POST)
        else:
            form = SignupForm(request.POST)
        if form.is_valid():
            password = User.objects.make_random_password()
            email = User.objects.normalize_email(form.cleaned_data['email1'])
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

            # Do login immediate
            result_user = authenticate(
                username=u.username,
                password=password
            )
            if result_user:
                auth_login(request, result_user)
                # Register site if user provided that information during signup
                if request.POST.get('schema_name') and request.POST.get('name'):
                    site_creator(form, result_user)

                return redirect('home')
            else:
                form.add_error('password', 'Internal error logging in. Check email for password and try to login.')

            return redirect('home')
    else:
        form = SignupForm()

    return render(request, 'account/form.html', {
        'title': 'Sign up',
        'form': form
    })


def login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST, form_class='form-horizontal')

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
        print form

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
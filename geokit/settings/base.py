"""
Django settings for geokit project.

Generated by 'django-admin startproject' using Django 1.8.

For more information on this file, see
https://docs.djangoproject.com/en/1.8/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.8/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
import sys

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_DIR = os.path.dirname(PROJECT_DIR)
GIPSBIN_PATH = os.path.join(os.path.sep, 'gipsbin')
GIPS_PATH = os.path.join(os.path.sep, 'gips')

RUNSERVER = False
if 'runserver' in sys.argv:
    DEBUG = True
    RUNSERVER = True
    if len(sys.argv) == 3:
        NODE_PORT = str(int(sys.argv[2].split(':')[1]) + 1)

# used to distinguish tenant portion of domain from the rest of it
GEOKIT_HOSTS = [
    '.geokit.localhost', 'geokit.localhost',
    '.geokit.io', 'geokit.io',
]

ALLOWED_HOSTS = list(GEOKIT_HOSTS)

if RUNSERVER:
    # Reasonable default, overwrite in local.py for different runserver domain
    SESSION_COOKIE_DOMAIN = '.geokit.localhost'
else:
    SESSION_COOKIE_DOMAIN = '.geokit.io'

# Application definition

SHARED_APPS = [
    'tenant_schemas',
    'account',

    'django.contrib.contenttypes',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',
    'django.contrib.postgres',

    'taggit',
    'compressor',
    'modelcluster',
    'rest_framework',
    'rest_framework_filters',
    'crispy_forms',
    'django_rq',
]

TENANT_APPS = [
    'django.contrib.contenttypes',
    'wagtail.wagtailcore',
    'wagtail.wagtailadmin',
    'wagtail.wagtailsearch',
    'wagtail.wagtailimages',
    'wagtail.wagtaildocs',
    'wagtail.wagtailsnippets',
    'wagtail.wagtailusers',
    'wagtail.wagtailembeds',
    # 'wagtail.wagtailredirects',
    'wagtail.wagtailforms',
    'wagtail.contrib.wagtailsearchpromotions',
    'wagtail.contrib.wagtailstyleguide',
    'wagtail.contrib.settings',
    'wagtail.wagtailsites',

    'search',
    'builder',
    'geokit_tables',
    'layers',
    'variables',
]

INSTALLED_APPS = SHARED_APPS + [app for app in TENANT_APPS if app not in SHARED_APPS]

TENANT_MODEL = "account.GeoKitSite"

REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ('django_filters.rest_framework.DjangoFilterBackend',)
}

DEFAULT_FILE_STORAGE = 'tenant_schemas.storage.TenantFileSystemStorage'

MIDDLEWARE_CLASSES = [
    # implement tenant_schemas logic as well as wagtail sites middleware
    'geokit.middleware.TenantMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # 'wagtail.wagtailredirects.middleware.RedirectMiddleware',
]

ROOT_URLCONF = 'geokit.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(PROJECT_DIR, 'account/templates'),
            os.path.join(PROJECT_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'builtins': ['overextends.templatetags.overextends_tags'],
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

CRISPY_TEMPLATE_PACK = 'bootstrap3'

WSGI_APPLICATION = 'geokit.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'tenant_schemas.postgresql_backend',
        'NAME': 'geokits',
        'USER': 'geokit',
        'PASSWORD': 'geokitp4ss',
        'HOST': 'localhost',
        'PORT': '5432',
    },
    'geodata': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'geodata',
        'USER': 'geokit',
        'PASSWORD': 'geokitp4ss',
        'HOST': 'localhost',
        'PORT': '5432',
    },
}

DATABASE_ROUTERS = (
    'tenant_schemas.routers.TenantSyncRouter',
)

ORIGINAL_BACKEND = 'django.contrib.gis.db.backends.postgis'
POSTGIS_VERSION = (2, 1, 8)

RPC_URL = 'http://localhost:8001'

RQ_QUEUES = {
    'default': {
        'HOST': 'localhost',
        'PORT': 6379,
        'DB': 0,
        'DEFAULT_TIMEOUT': 360,
    }
}

RQ_EXCEPTION_HANDLERS = ['geokit.error_handlers.dispatch_error']

PUBLIC_SCHEMA_URLCONF = 'account.urls'

LOGIN_URL = '/login/'

RPC_URL = 'http://schedtst.ags.io:8000'

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
)

STATICFILES_DIRS = (
    os.path.join(PROJECT_DIR, 'static'),
)

STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATIC_URL = '/static/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'


# Wagtail settings

WAGTAIL_SITE_NAME = "geokit"

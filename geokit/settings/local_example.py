from .base import DATABASES, GEOKIT_HOSTS, ALLOWED_HOSTS

'''
## Add your domain to this list
GEOKIT_HOSTS.append('testserver') # django's hostname in testing mode
GEOKIT_HOSTS.append('geokit.testserver')
GEOKIT_HOSTS.append('.geokit.testserver')

ALLOWED_HOSTS.append('testserver')
ALLOWED_HOSTS.append('geokit.testserver')
ALLOWED_HOSTS.append('.geokit.testserver')

DATABASES['default']['TEST'] = {'NAME': 'test_pavel_geokit_2' }

RPC_URL = 'http://localhost:8001'

# Ensure this is off in a production environment
DEBUG = True

# Make sure this matches your domain
SESSION_COOKIE_DOMAIN = 'geokit.testserver'

MEDIA_ROOT = '/web/geokit/media'

# Add any site administrators here
ADMINS = [
    ('You',   'you@your_email.com'),
]
'''

# Example of DEBUG_TOOLBAR

'''
from .base import INSTALLED_APPS, MIDDLEWARE_CLASSES

INSTALLED_APPS += [
    'debug_toolbar',
]

MIDDLEWARE_CLASSES += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

DEBUG_TOOLBAR_PANELS = [
    'debug_toolbar.panels.profiling.ProfilingPanel'
]

INTERNAL_IPS = ['10.0.0.153']
'''

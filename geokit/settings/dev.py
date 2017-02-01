from __future__ import print_function
import sys

from .base import *


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True
TEMPLATES[0]['OPTIONS']['debug'] = True

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'ipcioxdq^7+hjd1a6!0)4*a#gzckyjw9198w&(ae(x-lf@!cin'

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Import local.py but only if it exists.  Note that if local.py itself
# contains 'import local' and that fails, it will be silently ignored.
try:
    from .local import *
except ImportError as ie:
    if ie.message in ('cannot import name local', 'No module named local',):
        print('No local settings file found.', file=sys.stderr)
    else:
        raise

assert SESSION_COOKIE_DOMAIN in ALLOWED_HOSTS, "Will not be able to login"
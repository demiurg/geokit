from __future__ import print_function
import sys

from .base import *


DEBUG = False
TEMPLATES[0]['OPTIONS']['debug'] = False

# Import local.py but only if it exists.  Note that if local.py itself
# contains 'import local' and that fails, it will be silently ignored.
try:
    from .local import *
except ImportError as ie:
    if ie.message == 'cannot import name local':
        print('No local settings file found.', file=sys.stderr)
    else:
        raise

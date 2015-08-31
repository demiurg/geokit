from .base import *


DEBUG = False
TEMPLATES[0]['OPTIONS']['debug'] = False


try:
    from .local import *
except ImportError:
    pass

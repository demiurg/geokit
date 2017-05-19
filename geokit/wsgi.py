import os, sys

_cwd = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))

sys.path.insert(0, os.path.dirname(_cwd))
sys.path.insert(0, _cwd)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geokit.settings")

application = get_wsgi_application()

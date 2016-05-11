import os, sys

_cwd = os.path.realpath(os.path.dirname(os.path.abspath(__file__)))

sys.path.insert(0, os.path.dirname(_cwd))
sys.path.insert(0, _cwd)

#activate_this = os.path.realpath(os.path.join(_cwd, './../.venv/bin/activate_this.py'))
#execfile(activate_this, dict(__file__=activate_this))

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geokit.settings")

application = get_wsgi_application()

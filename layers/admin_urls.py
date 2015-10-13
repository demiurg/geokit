from django.conf.urls import url

from layers.views import index, add, edit, delete, layer_json, tile_json

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/([\w-]+)/$', edit, name='edit'),
    url(r'^delete/([\w-]+)/$', delete, name='delete'),

    url(r'^layer/([\w-]+)\.json$', layer_json, name='layer_json'),
    url(r'^(?P<layer_name>[\w-]+)/(?P<z>\d+)/(?P<x>\d+)/(?P<y>\d+)\.json$', tile_json, name='tile_json'),
]

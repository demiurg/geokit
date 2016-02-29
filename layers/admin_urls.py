from django.conf.urls import url

from layers.views import index, add, edit, delete, layer_json

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/([\w-]+)/$', edit, name='edit'),
    url(r'^delete/([\w-]+)/$', delete, name='delete'),

    url(r'^layer/([\w-]+)\.json$', layer_json, name='layer_json'),
]

from django.conf.urls import url

from layers import views

urlpatterns = [
    url(r'(\w+)/(\d+)/(\d+)/(\d+)\.json$', views.tile_json, name='layers_tile_json'),
]

from django.conf.urls import url

from layers import views

urlpatterns = [
    url(r'(\w+)/(\d+)/(\d+)/(\d+)\.json$', views.tile_json, name='layers_tile_json'),
    url(r'(\w+)/(\d+)/(\d+)/(\d+)\.mvt$', views.tile_mvt, name='layers_tile_mvt'),
]

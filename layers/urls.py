from django.conf.urls import url

from geokit.urls import router

from layers import views


router.register(r'features', views.FeatureViewSet)

urlpatterns = [
    url(r'(\w+)/(\d+)/(\d+)/(\d+)\.json$', views.tile_json, name='layers_tile_json'),
]

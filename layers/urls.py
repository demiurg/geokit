from django.conf.urls import url

from geokit.urls import router

from layers import views


router.register(r'features', views.FeatureViewSet)
router.register(r'layers', views.LayerViewSet)

urlpatterns = [
    url(r'^(\d+)/(\d+)/(\d+)/(\d+)\.json$', views.tile_json, name='layers_tile_json'),
    url(r'^gadm/(\d+)/(\d+)/(\d+)/(\d+)\.json$', views.gadm_tile_json),
    #url(r'^gadm/?$', views.GADMView.as_view(), name='gadm_view'),
    url(r'^vector-catalog/(\w+)/(\d+)/(\d+)/(\d+)\.json$', views.vector_catalog_tile_json, name='vector_catalog_tile_json'),
    url(r'^vector-catalog/?$', views.VectorCatalogView.as_view(), name='vector_catalog'),
]

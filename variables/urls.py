from django.conf.urls import url
from variables import views

urlpatterns = [
    url(r'^data_(\d+).json$', views.data_json),
    url(r'^raster_statuses.json$', views.raster_statuses),
    url(r'^variable_raster_status_(\d+).json$', views.variable_raster_status),
]

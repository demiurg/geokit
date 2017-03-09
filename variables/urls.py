from django.conf.urls import url
from variables import views

urlpatterns = [
    url(r'^map_(\d+).json$', views.map_json),
]

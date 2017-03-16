from django.conf.urls import url
from variables import views

urlpatterns = [
    url(r'^data_(\d+).json$', views.data_json),
]

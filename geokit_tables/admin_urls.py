from django.conf.urls import url

from geokit_tables.views import index, add


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
]

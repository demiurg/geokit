from django.conf.urls import url

from variables.views import index, add, edit, graph_data, map_data


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/(\w+)/$', edit, name='edit'),
    url(r'^graph/(\w+)/$', graph_data, name='graph'),
    url(r'^map/(\w+)/$', map_data, name='map'),
]

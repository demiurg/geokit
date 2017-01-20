from django.conf.urls import url

from layers.views import index, add, edit, delete, generate_download, layer_json, gadm_data

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/([\w-]+)/$', edit, name='edit'),
    url(r'^delete/([\w-]+)/$', delete, name='delete'),

    url('^download/([\w-]+)', generate_download, name='generate_download'),

    url(r'^layer/([\w-]+)\.json$', layer_json, name='layer_json'),

    url(r'^gadm/(\d+)/(\w+)/$', gadm_data, name='gadm_data'),
]

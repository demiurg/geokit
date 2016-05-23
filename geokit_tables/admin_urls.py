from django.conf.urls import url

from geokit_tables.views import index, add, edit, delete


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/([\w-]+)/$', edit, name='edit'),
    url(r'^delete/([\w-]+)/$', delete, name='delete'),
]

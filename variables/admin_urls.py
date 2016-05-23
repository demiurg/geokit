from django.conf.urls import url

from variables.views import index, add, edit


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^edit/(\d+)/$', edit, name='edit'),
]

from django.conf.urls import url

from expressions.views import index, delete, chooser, expression_chosen


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^delete/(\d+)/$', delete, name='delete'),
    url(r'^chooser/$', chooser, name='chooser'),
    url(r'^chooser/(\d+)/$', expression_chosen, name='expression_chosen'),
]

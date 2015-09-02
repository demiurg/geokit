from django.conf.urls import url

from expressions.views import index, add, chooser, expression_chosen


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^add/$', add, name='add'),
    url(r'^chooser/$', chooser, name='chooser'),
    url(r'^chooser/(\d+)/$', expression_chosen, name='expression_chosen'),
]

from django.conf.urls import url

from expressions.views import evaluate_on_tile

urlpatterns = [
    url('^evaluate/(\d+)/tile/(\w+)/(\d+)/(\d+)/(\d+)/$', evaluate_on_tile, name='evaluate_on_tile'),
]

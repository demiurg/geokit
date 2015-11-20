from django.conf.urls import url

from expressions.views import evaluate_on_tile

urlpatterns = [
    url(r'^evaluate/tile/(\w+)/(\d+)/(\d+)/(\d+)/(\d+)/$', evaluate_on_tile, name='evaluate_on_tile'),
]

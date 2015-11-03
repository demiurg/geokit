from django.conf.urls import url

from expressions.views import evaluate_on_feature

urlpatterns = [
    url('^evaluate/(\d+)/feature/(\d+)/$', evaluate_on_feature, name='evaluate_on_feature'),
]

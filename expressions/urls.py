from django.conf.urls import url

from geokit.urls import router

from expressions.views import evaluate_on_table, evaluate_on_tile, ExpressionViewSet, FormVariableViewSet


router.register(r'expressions', ExpressionViewSet)
router.register(r'form_variables', FormVariableViewSet)

urlpatterns = [
    url(r'^evaluate/table/(\d+)/([\w, ]+)/$', evaluate_on_table, name='evaluate_on_table'),
    url(r'^evaluate/tile/(\w+)/(\d+)/(\d+)/(\d+)/(\d+)/$', evaluate_on_tile, name='evaluate_on_tile'),
]

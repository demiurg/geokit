from geokit.urls import router

from . import views

router.register(r'tables', views.GeoKitTableViewSet)
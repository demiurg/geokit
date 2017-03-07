from django.conf.urls import url, include
from django.conf import settings
from rest_framework import routers
router = routers.DefaultRouter()

from geokit_tables import views as tables_views
from variables import views as variable_views

router.register(r'tables', tables_views.GeoKitTableViewSet)
router.register(r'variables', variable_views.VariableViewSet)
router.register(r'rasterrequests', variable_views.RasterRequestViewSet)


urlpatterns = [
    url(r'^account/', include('account.urls')),
    url(r'^builder/', include('builder.urls')),
    url(r'^layers/', include('layers.urls')),

    url(r'^api/', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    url(r'^django-rq/', include('django_rq.urls')),

    url(r'', include('builder.urls')),
]


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

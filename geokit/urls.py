from django.conf.urls import url, include
from django.conf import settings
from django.contrib import admin

from rest_framework import routers

from account import views as account_views

router = routers.DefaultRouter()

urlpatterns = [
    url(r'^$', account_views.index),
    url(r'^accounts/', include('account.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^builder/', include('builder.urls')),
    url(r'^expressions/', include('expressions.urls')),
    url(r'^layers/', include('layers.urls')),

    url(r'^api/', include(router.urls)),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.conf.urls import url, include
from django.conf import settings
from django.contrib import admin

from builder import urls as builder_urls
from account import urls as account_urls
from account import views as account_views

urlpatterns = [
    url(r'^$', account_views.index),
    url(r'^accounts/', include(account_urls)),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^builder/', include(builder_urls)),
]


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

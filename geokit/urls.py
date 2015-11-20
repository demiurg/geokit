from django.conf.urls import url, include
from django.conf import settings
from django.contrib import admin
from django.views.generic import TemplateView

from builder import urls as builder_urls
from account import urls as account_urls
from account import views as account_views

from expressions import urls as expressions_urls
from layers import urls as layers_urls

urlpatterns = [
    url(r'^$', account_views.index),
    url(r'^accounts/', include(account_urls)),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^builder/', include(builder_urls)),
    url(r'^expressions/', include(expressions_urls)),
    url(r'^layers/', include(layers_urls)),
    url(r'^test/', TemplateView.as_view(template_name='test.html')),
]


if settings.DEBUG:
    from django.conf.urls.static import static
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns

    # Serve static and media files from development server
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

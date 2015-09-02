from django.conf.urls import url, include
from django.contrib import admin

from builder import urls as builder_urls

urlpatterns = [
    url(r'^admin/', include(admin.site.urls)),
    url(r'^builder/', include(builder_urls)),
]

from django.conf.urls import url, include
from django.contrib import admin

from builder import urls as builder_urls
from account import urls as account_urls

urlpatterns = [
    url(r'^$', include(account_urls)),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^builder/', include(builder_urls)),
]

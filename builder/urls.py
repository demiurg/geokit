from django.conf.urls import include, url
from django.contrib import admin
from django.shortcuts import redirect

from wagtail.wagtailadmin import urls as wagtailadmin_urls
from wagtail.wagtaildocs import urls as wagtaildocs_urls
from wagtail.wagtailcore import urls as wagtail_urls

from search.views import search


def redirect_to_home(request):
    path = request.META['HTTP_HOST']
    print request.tenant.name
    if path.startswith(request.tenant.schema_name):
        import re
        path = re.sub('^{}'.format(request.tenant.schema_name), 'www', path)
        return redirect("http://" + path + '/login/')
    return redirect('/')


urlpatterns = [
    url(r'^django-admin/', include(admin.site.urls)),

    url(r'^admin/login', redirect_to_home),
    url(r'^admin/', include(wagtailadmin_urls)),
    url(r'^documents/', include(wagtaildocs_urls)),

    url(r'^search/$', search, name='search'),

    url(r'', include(wagtail_urls)),
]

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import DisallowedHost
from django.db import connection
from django.http import Http404

from tenant_schemas.utils import get_tenant_model, remove_www


class TenantMiddleware(object):
    """This class is a modified cutpaste of a class from django-tenant-schemas.

    This middleware should be placed at the very top of the middleware stack.
    Selects the proper database schema using the request host. Can fail in
    various ways which is better than corrupting or revealing data.
    """
    TENANT_NOT_FOUND_EXCEPTION = Http404

    def process_request(self, request):
        # Connection needs first to be at the public schema, as this is where
        # the tenant metadata is stored.
        connection.set_schema_to_public()

        host = request.get_host()
        hostname = remove_www(host.split(':')[0])
        subdomain = None
        for allowed in settings.GEOKIT_HOSTS:
            if hostname == allowed:
                break
            elif hostname.endswith(allowed):
                parts = hostname.split('.', 1)
                if parts[1] == allowed:
                    subdomain = parts[0]
                    break

        TenantModel = get_tenant_model()

        if subdomain is None:
            subdomain = 'public'
            request.urlconf = settings.PUBLIC_SCHEMA_URLCONF
            request.tenant = None
            return

        try:
            request.tenant = TenantModel.objects.get(schema_name=subdomain)
            if request.tenant.status == 'disabled':
                raise TenantModel.DoesNotExist
            connection.set_tenant(request.tenant)
        except TenantModel.DoesNotExist:
            raise self.TENANT_NOT_FOUND_EXCEPTION(
                'No tenant for name "%s"' % subdomain
            )

        # Fix ignore wagtail sites
        try:
            from wagtail.wagtailcore.models import Site
            site = Site.find_for_request(request)
            request.site = site
        except Site.DoesNotExist:
            request.site = None

        # Content type can no longer be cached as public and tenant schemas
        # have different models. If someone wants to change this, the cache
        # needs to be separated between public and shared schemas. If this
        # cache isn't cleared, this can cause permission problems. For example,
        # on public, a particular model has id 14, but on the tenants it has
        # the id 15. if 14 is cached instead of 15, the permissions for the
        # wrong model will be fetched.
        ContentType.objects.clear_cache()


class SuspiciousTenantMiddleware(TenantMiddleware):
    """
    Extend the TenantMiddleware in scenario where you need to configure
    ``ALLOWED_HOSTS`` to allow ANY domain_url to be used because your tenants
    can bring any custom domain with them, as opposed to all tenants being a
    subdomain of a common base.
    See https://github.com/bernardopires/django-tenant-schemas/pull/269 for
    discussion on this middleware.
    """
    TENANT_NOT_FOUND_EXCEPTION = DisallowedHost

from django.contrib.gis.db import models
from tenant_schemas.models import TenantMixin
from django.contrib.auth.models import User
import re


class GeoKitSite(TenantMixin):
    RESERVED = [
        'test', 'geokit', 'admin'
    ]

    user = models.ForeignKey(User)
    name = models.CharField(max_length=100, null=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)

    # default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

    @classmethod
    def is_allowed(cls, name):
        m = re.match(r'^[a-z0-9]+$', name)
        if m is None:
            return False

        return name not in cls.RESERVED

    @classmethod
    def is_available(cls, name):

        return cls.is_allowed(name) and not cls.objects.filter(schema_name=name).exists()
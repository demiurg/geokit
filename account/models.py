from django.db import models
from tenant_schemas.models import TenantMixin
from django.contrib.auth.models import User


class GeoKitSite(TenantMixin):
    user = models.ForeignKey(User)
    name = models.CharField(max_length=100, null=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)

    # default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True

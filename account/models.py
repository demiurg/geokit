from django.db import models
from tenant_schemas.models import TenantMixin


class GeoKitSite(TenantMixin):
    name = models.CharField(max_length=100, primary_key=True)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True)

    # default true, schema will be automatically created and synced when it is saved
    auto_create_schema = True
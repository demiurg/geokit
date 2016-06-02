from django.db import connection
from django.contrib.auth.models import User

from tenant_schemas.utils import get_tenant_model
from tenant_schemas.test.cases import TenantTestCase as BaseTenantTestCase


class TenantTestCase(BaseTenantTestCase):
    """Non-erroneous tenant model instantiation for geokit testing.

    The parent class assumes all fields can be null; this obviously fails.
    """
    @classmethod
    def setUpClass(cls):
        cls.sync_shared()
        tenant_domain = 'tenant.test.com'
        cls.user = User(username='tester')
        cls.user.save()
        cls.tenant = get_tenant_model()(domain_url=tenant_domain, schema_name='test', user=cls.user)
        verbosity = 1
        cls.tenant.save(verbosity=verbosity)
        cls.tenant.create_schema(check_if_exists=True, verbosity=verbosity)

        connection.set_tenant(cls.tenant)

    @classmethod
    def tearDownClass(cls):
        cls.user.delete()
        super(TenantTestCase, cls).tearDownClass()
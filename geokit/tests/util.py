import logging

from django.db import connection
from django.contrib.auth.models import User

from tenant_schemas.utils import get_tenant_model
from tenant_schemas.test.cases import TenantTestCase as BaseTenantTestCase


logger = logging.getLogger('tests.util')


class TenantTestCase(BaseTenantTestCase):
    """Non-erroneous tenant model instantiation for geokit testing.

    The parent class assumes all fields can be null; this obviously fails.
    """
    @classmethod
    def tenant_setup(cls, schema='test', tenant='tenant.test.com',
                     user='tester', teardown=False):
        """As the superclass's setUpClass but with conditionality built in.

        Tenant creation requires significant time due to (stupidly) repetitive
        application of (very slow) migrations.  Expedite this process by
        creating the tenant only if it's not already present.  If teardown is
        specified, the tenant & user will be destroyed in tearDownClass, and
        otherwise will persist for the next test class' use.
        """
        cls.sync_shared()
        cls.user, created = User.objects.get_or_create(username=user)
        if created:
            logger.info("Created user '{}'.".format(user))
        else:
            logger.info("User '{}' exists, not creating it.".format(user))
        Tenant = get_tenant_model()
        d = {'domain_url': tenant, 'schema_name': schema, 'user': cls.user}
        cls.tenant, created = Tenant.objects.get_or_create(schema_name='test',
                                                           defaults=d)
        if created:
            msg = 'No schema named "{}" detected; creating one'
            logger.info(msg.format(schema))
            cls.tenant.create_schema(check_if_exists=True)
            connection.set_tenant(cls.tenant)
        else:
            logger.info('Tenant with schema name "{}" found'.format(schema))
        connection.set_tenant(cls.tenant)
        cls.teardown = teardown

    @classmethod
    def setUpClass(cls):
        """Set up for testing by calling tenant_setup."""
        cls.tenant_setup()

    @classmethod
    def tearDownClass(cls):
        """If the user requested teardown, destroy the tenant and user."""
        if cls.teardown:
            sn = cls.tenant.schema_name
            logger.info("Tearing down tenant '{}' per request.".format(sn))
            cls.user.delete()
            super(TenantTestCase, cls).tearDownClass()

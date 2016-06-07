import logging

from django.db import connection
from django.contrib.auth.models import User

from tenant_schemas.utils import get_tenant_model
from tenant_schemas.test.cases import TenantTestCase

import pytest


logger = logging.getLogger('tests.util')

def make_tenant(schema='test', domain='tenant.test.com', username='tester'):
    """Returns a tuple:  (a tenant schema, an administrative user for it).

    `schema`:   Schema name
    `domain`:   Domain for the tenant site
    `username`: Username to be admin of the site

    Both user and tenant are created if they don't already exist, and the db
    connection is set to that tenant.  Logs to tests.util, level INFO.
    Tenant creation is conditional because it requires significant time.
    """
    TenantTestCase.sync_shared()
    # create or get the user
    user, created = User.objects.get_or_create(username=username)
    if created:
        logger.info("Created user '{}'.".format(user))
    else:
        logger.info("User '{}' exists, not creating it.".format(user))
    # create or get the tenant
    goc = get_tenant_model().objects.get_or_create
    d = {'domain_url': domain, 'schema_name': schema, 'user': user}
    tenant, created = goc(schema_name=schema, defaults=d)
    if created:
        msg = "No schema named '{}' detected; creating one"
        logger.info(msg.format(schema))
        tenant.create_schema(check_if_exists=True)
    else:
        logger.info("Tenant with schema name '{}' found".format(schema))
    connection.set_tenant(tenant)

    return (user, tenant)

@pytest.fixture
def testing_tenant(db, request):
    """Bundle make_tenant into a pytest fixture."""
    return make_tenant()

@pytest.fixture
def temp_testing_tenant(db, request):
    """Create a tenant, but clean it up aftewards via pytest magic."""
    (user, tenant) = make_tenant()
    yield (user, tenant)
    sn = tenant.schema_name
    logger.info("Tearing down tenant '{}' and its admin user.".format(sn))
    user.delete()
    TenantTestCase.tearDownClass()

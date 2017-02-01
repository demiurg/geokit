import pytest

from django.http import Http404
from django.conf import settings

from ..middleware import TenantMiddleware

def check_settings():
    if 'testserver'  not in settings.GEOKIT_HOSTS:
        raise Exception("The middleware tests will fail without testserver")

@pytest.mark.django_db
def test_TenantMiddleware_tenant_found(rf):
    """Should set the schema to the matching subdomain."""
    check_settings()
    req = rf.get('/anything/here/', SERVER_NAME='test.testserver')
    tm = TenantMiddleware()
    tm.process_request(req)
    assert req.tenant.schema_name == 'test'

def test_TenantMiddleware_no_tenant_found(rf):
    """No tenant should be present when there's no subdomain."""
    check_settings()
    req = rf.get('/anything/here/', SERVER_NAME='testserver')
    tm = TenantMiddleware()
    tm.process_request(req)
    assert req.tenant is None

@pytest.mark.django_db
def test_TenantMiddleware_umm(rf):
    """Should 404 when no tenant matches the subdomain."""
    req = rf.get('/anything/here/', SERVER_NAME='trolololo.testserver')
    tm = TenantMiddleware()
    with pytest.raises(Http404):
        tm.process_request(req)

import pytest

from ..middleware import TenantMiddleware

@pytest.mark.django_db
def test_TenantMiddleware_process_request_normal_case(rf):
    """It should set the schema appropriately."""
    req = rf.get('/anything/here/', SERVER_NAME='test.testserver')
    tm = TenantMiddleware()
    tm.process_request(req)
    assert req.tenant.schema_name == 'test'

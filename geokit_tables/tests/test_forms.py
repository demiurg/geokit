import io

import pytest
from django.test import RequestFactory
from django import forms

from geokit_tables.forms import GeoKitTableForm
from geokit.tests.util import set_tenant
from util import test_data


@pytest.fixture
def filled_gktf():
    """Set up a GeoKitTableForm with CSV for validation."""
    with io.StringIO(test_data) as fake_csv:
        post_vars = {
            'name': 'testtable',
            'csv_file': fake_csv
        }
        req = RequestFactory().post('/shouldnt/matter', post_vars)
        gktf = GeoKitTableForm(req.POST, req.FILES)
    return gktf


@pytest.mark.django_db
def test_gktf_normal_case(set_tenant, filled_gktf):
    """Check validation success with normal inputs."""
    assert filled_gktf.is_valid()

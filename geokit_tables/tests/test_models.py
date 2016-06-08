import io

import pytest
from django.test import RequestFactory
from django import forms

from geokit.tests.util import set_tenant

from geokit_tables.models import GeoKitTable, Record


def test_gkt_unicode_conversion():
    """Confirm a unicode object emerges when requested."""
    assert type(unicode(GeoKitTable())) is unicode

def test_record_unicode_conversion():
    """Confirm a unicode object emerges when requested."""
    assert type(unicode(Record())) is unicode

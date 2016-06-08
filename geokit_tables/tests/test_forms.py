import unittest
import io

import mock, pytest
from django.test import RequestFactory
from django.db import connection
from django import forms

from geokit_tables.forms import GeoKitTableForm
from geokit.tests.util import set_tenant


test_data = u"""fid,date,srad,prcp,tmin,tmax
0,2010-001,9.455,0.0,6.0,18.5
0,2010-002,11.163,0.0,5.0,22.5
0,2010-003,11.163,0.0,6.0,23.5
0,2010-004,10.935,0.0,6.0,22.5
0,2010-005,11.049,0.0,5.5,22.0
0,2010-006,10.821,0.0,5.5,21.0
0,2010-007,11.163,0.0,4.5,21.0
0,2010-008,10.935,0.0,6.0,22.0
0,2010-009,10.581,0.0,7.5,22.0
0,2010-010,10.696,0.0,8.0,23.0
0,2010-011,11.386,0.0,6.5,23.5
0,2010-012,10.581,0.0,6.5,20.5
0,2010-013,8.971,0.1,6.5,17.0
0,2010-014,10.696,0.0,4.0,17.5
0,2010-015,11.032,0.0,6.0,20.5
0,2010-016,9.754,0.0,7.0,18.5
0,2010-017,8.941,0.0,6.5,16.5
0,2010-018,4.296,2.6,8.0,14.0
0,2010-019,5.69,2.5,5.0,13.0
0,2010-020,4.455,2.3,6.5,12.5
0,2010-021,4.806,5.5,6.5,13.0
0,2010-022,4.22,3.6,5.5,11.0
0,2010-023,5.627,1.8,4.0,11.5
0,2010-024,11.137,0.0,1.5,14.0
0,2010-025,11.715,0.0,2.5,16.0
0,2010-026,10.768,0.0,3.5,15.0
0,2010-027,6.982,0.3,6.5,16.0
0,2010-028,11.123,0.0,4.5,16.5
0,2010-029,10.988,0.0,5.0,16.5
0,2010-030,11.347,0.0,4.0,16.0
0,2010-031,11.227,0.0,3.5,15.0
0,2010-032,11.825,0.0,4.5,17.0
0,2010-033,10.487,0.0,6.0,16.0
0,2010-034,11.09,0.0,5.0,15.5
0,2010-035,11.331,0.0,5.5,16.0
0,2010-036,6.326,0.8,7.5,14.5
0,2010-037,5.718,2.5,8.0,14.0
0,2010-038,6.326,1.1,6.0,12.5
0,2010-039,12.895,0.0,3.5,14.5
0,2010-040,8.348,1.0,5.0,13.5
0,2010-041,9.207,1.7,3.5,13.0
0,2010-042,14.24,0.0,3.0,15.0
0,2010-043,13.996,0.0,5.5,17.0
0,2010-044,15.359,0.0,6.0,20.5
0,2010-045,16.102,0.0,6.5,23.5
0,2010-046,16.246,0.0,6.5,23.5
0,2010-047,15.996,0.0,7.5,23.5
0,2010-048,15.496,0.0,7.5,22.0
0,2010-049,15.129,0.0,6.0,19.0
0,2010-050,9.834,0.0,8.5,15.5
0,2010-051,7.438,1.5,7.0,14.0
0,2010-052,7.122,0.5,7.5,14.0
0,2010-053,8.521,0.7,6.5,14.5
0,2010-054,16.152,0.0,3.0,16.5
0,2010-055,15.523,0.0,4.0,16.0
0,2010-056,14.24,0.0,7.0,17.5
0,2010-057,15.266,0.0,8.5,20.5
0,2010-058,8.928,2.5,7.5,15.5
0,2010-059,10.74,1.5,4.5,14.5
0,2010-060,15.786,0.0,5.5,17.0
0,2010-061,13.05,0.0,7.5,16.0
0,2010-062,13.833,0.0,6.5,15.5
0,2010-063,9.657,0.3,6.0,14.0
0,2010-064,17.108,0.0,3.5,15.5
0,2010-065,9.344,0.4,6.5,14.0
0,2010-066,7.299,0.5,6.5,12.0
0,2010-067,7.299,0.6,7.5,13.0
0,2010-068,9.157,0.3,5.0,12.0
0,2010-069,15.924,0.0,2.5,12.0
0,2010-070,18.199,0.0,3.0,15.0
0,2010-071,19.136,0.0,4.0,17.5
0,2010-072,18.349,0.0,4.5,16.5
0,2010-073,19.699,0.0,3.5,17.5
0,2010-074,20.913,0.0,5.5,22.5
0,2010-075,19.316,0.0,10.5,24.5
0,2010-076,20.268,0.0,9.5,25.0
0,2010-077,20.433,0.0,7.0,21.5
0,2010-078,19.336,0.0,8.0,20.5
0,2010-079,21.393,0.0,7.0,23.5
0,2010-080,20.321,0.0,8.0,22.0
0,2010-081,19.354,0.0,8.0,20.5
0,2010-082,17.833,0.0,8.5,19.5
0,2010-083,20.902,0.0,6.0,20.5
0,2010-084,19.23,0.0,6.5,18.5
0,2010-085,19.23,0.0,7.0,19.0
0,2010-086,22.472,0.0,6.5,23.5
0,2010-087,21.91,0.0,8.0,24.0
0,2010-088,22.083,0.0,7.0,23.0
0,2010-089,19.535,0.0,8.0,20.5
0,2010-090,15.855,0.0,7.5,16.5
0,2010-091,12.269,0.4,4.5,13.5
0,2010-092,20.401,0.0,3.5,16.0
0,2010-093,21.114,0.0,4.5,18.0
0,2010-094,16.246,0.0,7.0,16.0
0,2010-095,11.645,0.5,7.0,15.5
0,2010-096,22.141,0.0,3.5,18.0
0,2010-097,23.615,0.0,6.0,23.5
0,2010-098,23.18,0.0,6.5,23.5
0,2010-099,21.605,0.0,7.0,21.5
0,2010-100,17.518,0.0,8.5,19.0
0,2010-101,16.496,0.0,8.0,17.5
0,2010-102,10.296,1.6,8.0,15.5
0,2010-103,17.062,0.0,6.0,15.5
0,2010-104,21.475,0.0,5.0,18.0
0,2010-105,21.043,0.0,7.0,19.5
0,2010-106,20.006,0.0,8.5,20.0
0,2010-107,22.673,0.0,7.5,21.5
0,2010-108,23.739,0.0,8.0,23.5
0,2010-109,20.603,0.0,10.5,22.5
0,2010-110,20.454,0.0,9.0,20.5
0,2010-111,13.837,0.9,6.0,15.5
0,2010-112,11.581,2.2,4.5,12.0
0,2010-113,21.659,0.0,3.0,14.5
0,2010-114,21.363,0.0,7.5,19.0
0,2010-115,23.939,0.0,7.0,21.0
0,2010-116,22.575,0.0,8.5,21.0
0,2010-117,23.35,0.0,8.5,21.5
0,2010-118,18.467,0.2,10.0,19.0
0,2010-119,16.33,0.0,7.5,15.0
0,2010-120,23.827,0.0,5.0,17.5
0,2010-121,25.057,0.0,5.5,19.5
0,2010-122,21.06,0.0,8.5,19.0
0,2010-123,26.785,0.0,7.5,24.0
0,2010-124,24.927,0.0,9.5,24.0
0,2010-125,22.915,0.0,10.5,23.0
0,2010-126,21.212,0.0,11.0,22.0
0,2010-127,25.418,0.0,9.0,23.5
0,2010-128,25.106,0.0,10.0,24.0
0,2010-129,19.18,0.0,10.0,19.0
0,2010-130,21.043,0.0,8.5,18.5
0,2010-131,20.415,0.0,7.5,17.0
0,2010-132,26.854,0.0,5.0,20.0
0,2010-133,24.655,0.0,8.5,21.5
0,2010-134,22.931,0.0,10.0,21.5
0,2010-135,22.931,0.0,11.0,22.5
0,2010-136,19.927,0.0,11.5,21.0
0,2010-137,18.661,0.0,10.5,19.0
0,2010-138,21.499,0.0,10.0,20.0
0,2010-139,22.295,0.0,10.5,21.0
0,2010-140,26.436,0.0,10.0,24.0
0,2010-141,22.773,0.0,11.5,22.5
0,2010-142,20.703,0.0,10.0,19.5
0,2010-143,17.639,0.0,8.0,15.5
0,2010-144,23.893,0.0,6.0,17.0
0,2010-145,25.657,0.0,7.0,19.5
0,2010-146,24.374,0.0,8.5,20.0
0,2010-147,24.374,0.0,10.0,21.5
0,2010-148,22.282,0.0,9.5,19.5
0,2010-149,29.064,0.0,7.5,23.5
0,2010-150,29.064,0.0,9.0,25.0
0,2010-151,26.803,0.0,10.5,24.0
0,2010-152,23.574,0.0,11.5,22.5
0,2010-153,24.543,0.0,11.5,23.0
0,2010-154,24.06,0.0,13.0,24.0
0,2010-155,26.011,0.0,13.0,25.5
0,2010-156,27.149,0.0,13.5,27.0
0,2010-157,26.661,0.0,14.0,27.0
0,2010-158,25.036,0.0,14.5,26.0
0,2010-159,22.76,0.0,14.5,24.5
0,2010-160,21.947,0.0,14.0,23.5
0,2010-161,22.109,0.0,13.0,22.5
0,2010-162,19.671,0.0,11.5,19.5
0,2010-163,20.951,0.0,11.0,19.5
0,2010-164,27.825,0.0,10.0,23.0
0,2010-165,28.48,0.0,12.0,26.0
0,2010-166,28.316,0.0,13.0,27.0
0,2010-167,26.188,0.0,12.0,24.0
0,2010-168,28.807,0.0,10.0,24.5
0,2010-169,26.516,0.0,12.0,24.5
0,2010-170,24.552,0.0,13.0,24.0
0,2010-171,26.516,0.0,12.0,24.5
0,2010-172,25.861,0.0,11.5,23.5
0,2010-173,28.48,0.0,9.5,24.0
0,2010-174,26.679,0.0,12.5,25.5
0,2010-175,27.661,0.0,12.0,26.0
0,2010-176,27.661,0.0,12.0,26.0
0,2010-177,23.078,0.0,13.5,24.0
0,2010-178,24.552,0.0,13.5,25.0
0,2010-179,21.442,0.0,14.0,23.5
0,2010-180,25.697,0.0,13.5,25.5
0,2010-181,25.534,0.0,14.5,26.5
0,2010-182,28.152,0.0,13.5,28.0
0,2010-183,27.474,0.0,13.0,27.0
"""

@pytest.mark.django_db
def test_gktf_normal_case(set_tenant):
    """Check validation success with normal inputs."""
    with io.StringIO(test_data) as fake_csv:
        post_vars = {'date_column': 'date',
                     'name': 'testtable', 'csv_file': fake_csv}
        req = RequestFactory().post('/shouldnt/matter', post_vars)
        gktf = GeoKitTableForm(req.POST, req.FILES)
        assert gktf.is_valid()

@pytest.mark.django_db
def test_gktf_date_field_mismatch(set_tenant):
    """Confirm ValidationError emitted when date field names don't match."""
    with io.StringIO(test_data) as fake_csv:
        post_vars = {'date_column': 'I-M-RONG-FLD-NAME-LOL',
                     'name': 'testtable', 'csv_file': fake_csv}
        req = RequestFactory().post('/shouldnt/matter', post_vars)
        gktf = GeoKitTableForm(req.POST, req.FILES)
        assert not gktf.is_valid()


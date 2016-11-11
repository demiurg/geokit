import io
import datetime

import pytest

from util import test_data, test_dates, test_years
from csvkit import table as csvtable
from geokit_tables.views import get_schema, get_data, get_daterange
from geokit_tables.models import Record, GeoKitTable


@pytest.fixture
def create_tables():
    """Set up a schemas with CSV data for correct data type inference."""
    tables = []
    for fake_csv in (test_data, test_dates, test_years,):
        with io.StringIO(fake_csv) as fake_csv:
            tables.append(csvtable.Table.from_csv(fake_csv, name="test"))

    return tables


@pytest.mark.django_db
def test_column_types(create_tables):
    """Check validation success with normal inputs."""
    expect1 = {
        'srad': 'float',
        'tmin': 'float',
        'tmax': 'float',
        'fid': 'int',
        'date': 'str',
        'prcp': 'float'
    }

    expect2 = {
        'fid': 'int',
        'date': 'date',
        'srad': 'float',
        'prcp': 'float',
        'tmin': 'float',
        'tmax': 'float',
    }

    assert get_schema(create_tables[0]) == expect1
    assert get_schema(create_tables[1]) == expect2


@pytest.mark.django_db
def test_rows(create_tables):
    first_row = (0, datetime.date(2010, 1, 1), 9.455, 0.0, 6.0, 18.5)
    table = create_tables[1]
    rows = table.to_rows()
    assert rows[0] == first_row

    first_row = {
        'srad': 9.455,
        'tmin': 6.0,
        'tmax': 18.5,
        'fid': 0,
        'date': datetime.date(2010, 1, 1),
        'prcp': 0.0
    }

    assert get_data(table)[0] == first_row


@pytest.mark.django_db
def test_date(create_tables):
    row = {
        'srad': 9.455,
        'tmin': 6.0,
        'tmax': 18.5,
        'fid': 0,
        'date': datetime.date(2010, 1, 1),
        'prcp': 0.0
    }
    assert get_daterange({'date': 'date'}, row) is not None


@pytest.mark.django_db
def test_records(create_tables):
    for table in create_tables:
        records = []
        t = GeoKitTable()
        schema = get_schema(table)

        for row in get_data(table):
            date_range = get_daterange(schema, row)

            records.append(Record(
                table=t, properties=row, date_range=date_range
            ))

        for r in records:
            assert r.date_range is not None

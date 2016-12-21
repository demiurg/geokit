import json
import os

from django.core.management.base import BaseCommand
from django.core.serializers import serialize
from django.db import connection
from django.db.models import Q

from geokit_tables.models import GeoKitTable, Record


class Command(BaseCommand):
    help = ("Generates fixtures for `geokit_tables` app. "
            "Assumes `cnty_24k97_data` table has been loaded.")

    def add_arguments(self, parser):
        parser.add_argument(
            'schema', type=str, help='Schema to pull test data from.'
        )

    def handle(self, *args, **options):
        connection.set_schema(options['schema'])

        table = GeoKitTable.objects.get(name='cnty_24k97_data')
        records = Record.objects.filter(
            Q(table=table),
            Q(properties__fid=34) | Q(properties__fid=35)
        )

        serialized_table = serialize('json', [table])
        serialized_records = serialize('json', records)

        table_list = json.loads(serialized_table)
        records_list = json.loads(serialized_records)

        fixtures = table_list + records_list

        with open(
            os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                '../../fixtures/geokit_tables_fixtures.json'
            ),
            'w'
        ) as outfile:
            json.dump(fixtures, outfile, sort_keys=True, indent=4)

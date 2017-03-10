from django.core.management.base import BaseCommand
from django.db import connection

from IPython import start_ipython


class Command(BaseCommand):
    help = 'Open a Django shell with the database connected to the specified schema'

    def add_arguments(self, parser):
        parser.add_argument('schema', nargs=1, type=str)

    def handle(self, *args, **options):
        connection.set_schema(options['schema'][0])

        start_ipython(argv=[])

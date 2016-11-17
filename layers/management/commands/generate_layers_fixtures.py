import json
import os

from django.core.management.base import BaseCommand
from django.core.serializers import serialize
from django.db import connection
from django.db.models import Q

from layers.models import Feature, Layer


class Command(BaseCommand):
    help = ("Generates fixtures for `layers` app. "
            "Assumes `cnty_24k97` layer has been loaded.")

    def add_arguments(self, parser):
        parser.add_argument('schema', type=str, help='Schema to pull test data from.')

    def handle(self, *args, **options):
        connection.set_schema(options['schema'])

        layer = Layer.objects.get(name='cnty_24k97')
        features = Feature.objects.filter(
            Q(layer=layer),
            Q(properties__fid=24) | Q(properties__fid=35)
        )

        serialized_layer = serialize('json', [layer])
        serialized_features = serialize('json', features)

        layer_list = json.loads(serialized_layer)
        features_list = json.loads(serialized_features)

        fixtures = layer_list + features_list

        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../fixtures/layers_fixtures.json'), 'w') as outfile:
            json.dump(fixtures, outfile)

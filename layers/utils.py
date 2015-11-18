import os

from django.conf import settings
from django.http import HttpResponse
from django.middleware.gzip import GZipMiddleware
from django.template.loader import render_to_string

from layers.models import Layer


def tile_cache(func):
    def wrapped_function(request, layer_name, z, x, y):
        x, y, z = int(x), int(y), int(z)

        tile_cache_path = os.path.realpath(settings.STATIC_ROOT + '/tiles')
        layer_cache_path = os.path.realpath(settings.STATIC_ROOT + '/layers')

        layer = Layer.objects.get(name=layer_name)
        name = layer.query_hash()
        tile_path = tile_cache_path + '/{}/{}/{}/{}.pbf'.format(name, z, x, y)
        layer_path = layer_cache_path + '/{}.xml'.format(name)

        if not os.path.isfile(tile_path):
            if not os.path.isfile(layer_path):
                mapnik_config = render_to_string(
                    'layers/mapnik/mapnik_config.xml',
                    {'layer_name': layer_name, 'query': layer.mapnik_query()}
                )

                with open(layer_path, 'w') as f:
                    f.write(mapnik_config)

            response = func(request, name, z, x, y)
        else:
            print "Sending cached tile..."
            response = HttpResponse(content_type='application/x-protobuf')
            with open(tile_path, 'rb') as f:
                response.write(f.read())

            gzip_middleware = GZipMiddleware()
            response = gzip_middleware.process_response(request, response)

        return response
    return wrapped_function

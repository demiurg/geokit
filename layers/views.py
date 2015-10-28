import mimetypes
import urllib2

from django.shortcuts import redirect, render, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry
from django.contrib.gis.gdal import SpatialReference
from django.http import HttpResponse
from django.middleware.gzip import GZipMiddleware
from django.template.loader import render_to_string

from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm

from fiona.crs import to_string
from shapely.geometry import shape
import json
import os


def layer_json(request, layer_name):
    layer = get_object_or_404(Layer, pk=layer_name)

    features = []
    for f in layer.feature_set.all():
        features.append('''{
            "type": "Feature",
            "properties": {},
            "geometry": {}
        }'''.format(json.dumps(dict(f.properties)), f.geometry.json))

    geojson = '''{
        "type": "FeatureCollection",
        "features": {}
    }'''.format(",".join(features))

    return HttpResponse(geojson)


#def tile_json(request, layer_name, z, x, y):
    #x, y, z = int(x), int(y), int(z)
    #mimetype, data = stache(request, layer_name, z, x, y, "mvt")

    #mvt_features = mvt.decode(StringIO(data))
    #features = []
    #for wkb, props in mvt_features:
        #geom = GEOSGeometry(buffer(wkb))

        #feature  = '{ "type": "Feature", "geometry": '  + geom.json + ","
        #feature += json.dumps(props)[1:-1]
        #feature += '}'
        #features.append(feature)

    #features = ",".join(features)
    #response = '{"type": "FeatureCollection", "features": [' + features + ']}'
    #return HttpResponse(response, content_type=mimetype)


def tile_mvt(request, layer_name, z, x, y, extension=None):
    x, y, z = int(x), int(y), int(z)

    tile_cache_path = os.path.realpath(os.path.dirname(__file__) + "/../static/tiles")
    layer_cache_path = os.path.realpath(os.path.dirname(__file__) + "/../static/layers")

    layer = Layer.objects.get(name=layer_name)
    name = layer.query_hash()
    tile_path = tile_cache_path + '/{}/{}/{}/{}.pbf'.format(name, z, x, y)
    layer_path = layer_cache_path + '/%s.xml' % name

    if not os.path.isfile(tile_path):
        if not os.path.isfile(layer_path):
            mapnik_config = render_to_string(
                'layers/mapnik/mapnik_config.xml',
                {'layer_name': layer_name, 'query': layer.mapnik_query()}
            )

            with open(layer_path, 'w') as f:
                f.write(mapnik_config)
        url = 'http://localhost:{}/{}/{}/{}/{}'.format(settings.NODE_PORT, name, z, x, y)

        try:
            # Proxy request to Node.js MVT server
            request = urllib2.Request(url, headers={
                'Content-Type': request.META['CONTENT_TYPE'],
                'Accept-Encoding': request.META['HTTP_ACCEPT_ENCODING'],
            })
            proxied_request = urllib2.urlopen(request)
            status_code = proxied_request.code
            mimetype = proxied_request.headers.typeheader or mimetypes.guess_type(url)
            content = proxied_request.read()
        except urllib2.HTTPError as e:
            response = HttpResponse(e.msg, status=e.code, content_type='text/plain')
        else:
            response = HttpResponse(content, status=status_code, content_type=mimetype)
            response['Content-Encoding'] = 'deflate'

    else:
        print "Sending cached tile..."
        response = HttpResponse(content_type='application/x-protobuf')
        with open(tile_path, 'rb') as f:
            response.write(f.read())

        gzip_middleware = GZipMiddleware()
        response = gzip_middleware.process_response(request, response)

    return response


def index(request):
    layers = Layer.objects.all().filter(status=0)

    # Ordering
    if 'ordering' in request.GET and request.GET['ordering'] in ['-name', '-created']:
        ordering = request.GET['ordering']
    else:
        ordering = '-created'
    layers = layers.order_by(ordering)

    return render(request, 'layers/index.html', {
        'layers': layers,
    })


def add(request):
    if request.method == 'POST':
        form = LayerForm(request.POST, request.FILES)

        if form.is_valid():
            l = form.save()

            count = 0
            try:
                col = form.get_collection()
                l.bounds = col.bounds
                srs = to_string(form.layer_crs())
                sr = SpatialReference(srs)
                for record in col:
                    count += 1
                    geom = shape(record['geometry'])
                    f = Feature(
                        layer=l,
                        geometry=GeometryCollection(GEOSGeometry(geom.wkt), srid=sr.srid),
                        properties=record['properties']
                    )
                    f.save()

                if count == 0:
                    raise Exception("Layer needs to have at least one feature")

                l.status = 0
                l.save()

                messages.success(request, "Layer added.")
                return redirect('layers:index')
            except Exception as e:
                print e
                l.delete()
                form.add_error(
                    "vector_file",
                    "Error on saving layer feature #{}".format(count)
                )

        else:
            messages.error(request, "The layer could not be saved due to errors.")
    else:
        form = LayerForm()

    return render(request, 'layers/add.html', {'form': form})


def edit(request, layer_name):
    layer = get_object_or_404(Layer, pk=layer_name)

    if request.POST:
        form = LayerEditForm(request.POST, instance=layer)
        if form.is_valid():
            layer = form.save()

            messages.success(request, _("Layer '{0}' updated").format(layer.name), buttons=[
                messages.button(reverse('layers:edit', args=(layer.pk,)), _('Edit'))
            ])
            return redirect('layers:index')
        else:
            messages.error(request, _("The layer could not be saved due to errors."))
    else:
        form = LayerEditForm(instance=layer)

    '''
    filesize = None

    # Get file size when there is a file associated with the Layer object
    if layer.file:
        try:
            filesize = layer.file.size
        except OSError:
            # File doesn't exist
            pass

    if not filesize:
        messages.error(request, _("The file could not be found. Please change the source or delete the layer"), buttons=[
            messages.button(reverse('layers:delete', args=(layer.id,)), _('Delete'))
        ])
    '''
    return render(request, "layers/edit.html", {
        'layer': layer,
        'form': form
    })


def delete(request, layer_name):
    layer = get_object_or_404(Layer, pk=layer_name)

    layer.delete()

    messages.success(request, _("Layer '{0}' deleted").format(layer_name))
    return redirect('layers:index')

from cStringIO import StringIO
import json
import md5
import mimetypes
import os
import urllib2

from django.shortcuts import redirect, render, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry
from django.contrib.gis.gdal import OGRGeometry
from django.http import HttpResponse

from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm
from utils import mapnik_xml, tile_cache

from fiona.crs import to_string
import ModestMaps
from shapely.geometry import shape
import TileStache
from TileStache.Goodies.VecTiles import mvt


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


def tile_json(request, layer_name, z, x, y):
    x, y, z = int(x), int(y), int(z)
    mimetype, data = stache(request, layer_name, z, x, y, "mvt")

    mvt_features = mvt.decode(StringIO(data))
    features = []
    for wkb, props in mvt_features:
        geom = GEOSGeometry(buffer(wkb))
        geom.srid = 3857
        geom.transform(4326)

        try:
            props['id'] = props-['__id__']
        except:
            pass

        feature = '{ "type": "Feature", "geometry": ' + geom.json + ","
        feature += ' "properties": {}'.format(json.dumps(props))
        feature += '}'
        features.append(feature)

    features = ",\n".join(features)
    response = '{"type": "FeatureCollection", "features": [' + features + ']}'
    return HttpResponse(response, content_type="application/json")


def stache(request, layer_name, z, x, y, extension):
    x, y, z = int(x), int(y), int(z)

    cache_path = os.path.join(settings.STATIC_ROOT, "tiles")

    SELECT = """
        WITH bbox AS (SELECT !bbox! as bb),
            bufbox AS (SELECT st_buffer(bbox.bb, 500, 'quad_segs=1') as buf FROM bbox),
            px_area AS (SELECT st_area(bbox.bb) / 65536.0 as a FROM bbox)
        SELECT * FROM(
            SELECT
                ST_CollectionExtract(geometry, 1) AS __geometry__,
                id AS __id__,
                properties
            FROM layers_feature
            WHERE layer_id = '{0}'
            UNION
            SELECT
                ST_CollectionExtract(geometry, 2) AS __geometry__,
                id AS __id__,
                properties
            FROM layers_feature
            WHERE layer_id = '{0}'
            UNION
            SELECT
                ST_CollectionExtract(geometry, 3) AS __geometry__,
                id AS __id__,
                properties
            FROM layers_feature, px_area
            WHERE layer_id = '{0}' AND st_area(geometry) > px_area.a
        ) as extr WHERE NOT ST_isEmpty(__geometry__)
    """.format(layer_name)

    name = md5.md5(SELECT).hexdigest()
    name = layer_name + '_poly'

    config = {
        "cache": {
            "name": "Disk",
            "path": cache_path,
            "umask": "0000",
            "dirs": "portable"
        },
        "layers": {
            name: {
                "allowed origin": "*",
                "provider": {
                    "class": "TileStache.Goodies.VecTiles:Provider",
                    "projection": "spherical mercator",
                    "kwargs": {
                        "srid": 3857,
                        "clip": False,
                        "simplify": 3,
                        "dbinfo": {
                            'host': settings.DATABASES['default']['HOST'],
                            'user': settings.DATABASES['default']['USER'],
                            'password': settings.DATABASES['default']['PASSWORD'],
                            'database': settings.DATABASES['default']['NAME'],
                        },
                        "queries": [SELECT]
                    },
                },
            },
        },
    }

    if "cfg" in request.GET:
        return HttpResponse(json.dumps(config, indent=4 * ' '))

    # like http://tile.openstreetmap.org/1/0/0.png
    coord = ModestMaps.Core.Coordinate(y, x, z)

    config = TileStache.Config.buildConfiguration(config)

    mimetype, data = TileStache.getTile(
        config.layers[name], coord, extension
    )

    return mimetype, data


mapnik_xml
@tile_cache
def tile_mvt(request, layer_name, z, x, y):
    url = 'http://localhost:{}/{}/{}/{}/{}'.format(settings.NODE_PORT, layer_name, z, x, y)

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
                srs = to_string(form.layer_crs())
                min_bounds = OGRGeometry('POINT ({} {})'.format(col.bounds[0], col.bounds[1]),
                        srs=srs).transform(4326, clone=True)
                max_bounds = OGRGeometry('POINT ({} {})'.format(col.bounds[2], col.bounds[3]),
                        srs=srs).transform(4326, clone=True)
                l.bounds = min_bounds.coords + max_bounds.coords
                for record in col:
                    count += 1
                    geom = shape(record['geometry'])
                    transformed_geom = OGRGeometry(geom.wkt, srs=srs).transform(3857, clone=True)
                    f = Feature(
                        layer=l,
                        geometry=GeometryCollection(transformed_geom.geos),
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

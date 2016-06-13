import json
import os

from django.shortcuts import redirect, render, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry
from django.contrib.gis.gdal import OGRGeometry
from django.http import HttpResponse
from django.db import connection

from rest_framework import viewsets
from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm
from serializers import FeatureSerializer, LayerSerializer

from fiona.crs import to_string
from shapely.geometry import shape
from . import mvt

from .globalmaptiles import GlobalMercator
import fcntl
import errno
import traceback


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
    # mimetype, data = stache(request, layer_name, z, x, y, "mvt")
    # mvt_features = mvt.decode(StringIO(data))

    if request.tenant is not None:
        cache_path = os.path.join(settings.STATIC_ROOT, "tiles", str(request.tenant.pk))
    else:
        cache_path = os.path.join(settings.STATIC_ROOT, "tiles")

    mvt_features = manual_mvt(cache_path, layer_name, z, x, y)
    features = []
    for wkb, props in mvt_features:
        geom = GEOSGeometry(buffer(wkb))
        geom.srid = 3857
        geom.transform(4326)

        try:
            props['properties']['id'] = props['__id__']
        except Exception as e:
            print(e)

        feature = '{ "type": "Feature", "geometry": ' + geom.json + ","
        feature += ' "properties": {}'.format(json.dumps(props['properties']))
        feature += '}'
        features.append(feature)

    features = ",\n".join(features)
    response = '{"type": "FeatureCollection", "features": [' + features + ']}'
    return HttpResponse(response, content_type="application/json")


def manual_mvt(cache_path, layer_name, z, x, y):
    x, y, z = int(x), int(y), int(z)

    file_path = "{}/{}/{}/{}/{}.mvt".format(cache_path, layer_name, z, x, y)
    lock_path = "{}/{}/{}/{}/{}.mvt.lock".format(cache_path, layer_name, z, x, y)

    while not os.path.exists(os.path.dirname(file_path)):
        try:
            os.makedirs(os.path.dirname(file_path), 0777)
        except OSError as e:
            if e.errno == errno.EEXIST:
                pass

    lock = Lock(lock_path)
    lock.acquire()

    try:
        mvt_file = open(file_path, "rb")
        mvt_data = mvt.decode(mvt_file)
        mvt_file.close()
        return mvt_data
    except IOError as e:
        if e.errno == errno.ENOENT:
            mvt_file = open(file_path, "wb")

    try:
        gb = GlobalMercator()
        x, y = gb.GoogleTile(x, y, z)
        bbox_m = gb.TileBounds(x, y, z)
        bbox = bbox2wkt(bbox_m)

        SELECT = """
            WITH box AS (SELECT ST_GeomFromText('{0}') AS b),
                px_area AS (SELECT st_area(box.b) / 65536.0 AS a FROM box),
                px_length AS (SELECT sqrt(px_area.a) AS l FROM px_area),
                bufbox AS (SELECT st_buffer(box.b, px_length.l*8, 'quad_segs=1') AS buf FROM box, px_area, px_length),
                area_threshhold AS (SELECT px_area.a * 20 AS a, px_area.a / 4 as b FROM px_area),
                area_polygons AS (
                    SELECT
                        ST_CollectionExtract(geometry, 3) AS __geometry__,
                        id AS __id__,
                        properties,
                        st_area(geometry) as area
                    FROM layers_feature, px_area, box, area_threshhold
                    WHERE layer_id = '{1}' AND geometry && box.b AND
                        st_area(geometry) > area_threshhold.b
                ),
                polygons AS (
                    SELECT * FROM area_polygons ORDER BY area DESC
                ),
                big_poly AS (
                    SELECT * FROM polygons, area_threshhold WHERE area > area_threshhold.a
                ),
                small_poly AS (
                    SELECT
                        st_centroid(st_envelope(__geometry__)) as __geometry__,
                        __id__, properties, area
                    FROM polygons, box, area_threshhold
                    WHERE area < area_threshhold.a
                    LIMIT 200
                ),
                selection AS (
                    SELECT * FROM(
                        SELECT
                            ST_CollectionExtract(geometry, 1) AS __geometry__,
                            id AS __id__,
                            properties
                        FROM layers_feature
                        WHERE layer_id = '{1}'
                        UNION
                        SELECT
                            ST_CollectionExtract(geometry, 2) AS __geometry__,
                            id AS __id__,
                            properties
                        FROM layers_feature
                        WHERE layer_id = '{1}'
                        UNION
                        SELECT __geometry__, __id__, properties FROM big_poly
                    ) as extr WHERE NOT ST_isEmpty(__geometry__)
                )
            SELECT
                __geometry__, __id__, properties
            FROM (
                (SELECT
                    ST_AsEWKB(st_intersection(
                        ST_MakeValid(ST_Simplify(__geometry__, px_length.l * 2.0)),
                        bufbox.buf
                    )) AS __geometry__,
                    __id__,
                    properties
                FROM selection, bufbox, px_length)
            ) as Q
            WHERE __geometry__ IS NOT NULL AND NOT ST_isEmpty(__geometry__)
            UNION
            SELECT __geometry__, __id__, properties FROM small_poly""".format(
                bbox, layer_name
            )

        # print SELECT
        cursor = connection.cursor()
        cursor.execute(SELECT)

        columns = [col[0] for col in cursor.description]

        data = [
            (bytes(row[0]), dict(zip(columns[1:], row[1:])),)
            for row in cursor.fetchall()
        ]

        try:
            mvt.encode(mvt_file, data)
        except Exception as e:
            mvt_file.close()
            os.unlink(file_path)
        finally:
            mvt_file.close()
    except Exception as e:
        lock.release()
        os.unlink(file_path)
        traceback.print_exc()
        raise e

    lock.release()

    return data


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

                min_bounds = OGRGeometry(
                    'POINT ({} {})'.format(col.bounds[0], col.bounds[1]),
                    srs=srs
                ).transform(4326, clone=True)
                max_bounds = OGRGeometry(
                    'POINT ({} {})'.format(col.bounds[2], col.bounds[3]),
                    srs=srs
                ).transform(4326, clone=True)

                l.bounds = min_bounds.coords + max_bounds.coords

                features = []
                for index, record in enumerate(col):
                    try:
                        geom = shape(record['geometry'])
                        transformed_geom = OGRGeometry(geom.wkt, srs=srs).transform(3857, clone=True)
                        properties = record['properties']
                        properties['fid'] = index
                        features.append(Feature(
                            layer=l,
                            geometry=GeometryCollection(transformed_geom.geos),
                            properties=properties
                        ))
                        count += 1
                    except Exception as e:
                        print "Feature excepton", e

                if count == 0:
                    raise Exception("Layer needs to have at least one feature")

                Feature.objects.bulk_create(features)

                l.field_names = col.schema['properties'].keys() + "fid"
                l.status = 0
                l.save()

                messages.success(request, "Layer added.")
                return redirect('layers:index')
            except Exception as e:
                print e
                traceback.print_exc()
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


def bbox2wkt(bbox, srid=3857):
    if srid == 3857:
        wkt = 'SRID={0};POLYGON(({3} {4}, {1} {4}, {1} {2}, {3} {2}, {3} {4}))'.format(srid, *bbox)
    elif srid == 4326:
        wkt = 'SRID={0};POLYGON(({4} {3}, {4} {1}, {2} {1}, {2} {3}, {4} {3}))'.format(srid, *bbox)
    else:
        raise Exception("Only supports mercator and geographic")
    return wkt


class Lock:
    def __init__(self, filename):
        self.filename = filename
        # This will create it if it does not exist already
        self.handle = open(filename, 'w')

    # Bitwise OR fcntl.LOCK_NB if you need a non-blocking lock
    def acquire(self):
        fcntl.flock(self.handle, fcntl.LOCK_EX)

    def release(self):
        fcntl.flock(self.handle, fcntl.LOCK_UN)

    def __del__(self):
        self.handle.close()
        os.unlink(self.filename)


class FeatureViewSet(viewsets.ModelViewSet):
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer


class LayerViewSet(viewsets.ModelViewSet):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer

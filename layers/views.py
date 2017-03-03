import glob
import json
import os

from django.shortcuts import redirect, render, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry
from django.contrib.gis.gdal import OGRGeometry
from django.http import HttpResponse, JsonResponse
from django.db import connection, connections, transaction

import django_rq
from psycopg2.extensions import AsIs

from rest_framework import views, viewsets
from rest_framework.decorators import api_view
from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm
from serializers import FeatureSerializer, LayerSerializer

import fiona
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


def gadm_tile_json(request, level, z, x, y):
    level, x, y, z = int(level), int(x), int(y), int(z)
    # mimetype, data = stache(request, layer_name, z, x, y, "mvt")
    # mvt_features = mvt.decode(StringIO(data))

    names = ", ".join(
        ['name_{}'.format(r) for r in range(min(level, 5) + 1)]
    )
    hascs = ", ".join(
        ['hasc_{}'.format(r) for r in range(min(level, 3) + 1)]
    )

    cache_path = os.path.join(
        settings.STATIC_ROOT, "tiles", "common", "gadm"
    )

    mvt_features = gadm_mvt(cache_path, names, hascs, level, z, x, y)
    features = []
    for wkb, props in mvt_features:
        geom = GEOSGeometry(buffer(wkb))

        try:
            props['id'] = props['__id__']
        except Exception as e:
            print(e)

        feature = '{ "type": "Feature", "geometry": ' + geom.json + ","
        feature += ' "properties": {}'.format(json.dumps(props))
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


def gadm_mvt(cache_path, names, hascs, level, z, x, y):
    x, y, z = int(x), int(y), int(z)

    level = min(level, 5)

    file_path = "{}/{}/{}/{}/{}.mvt".format(cache_path, level, z, x, y)
    lock_path = "{}/{}/{}/{}/{}.mvt.lock".format(cache_path, level, z, x, y)

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
            WITH box AS (SELECT ST_Transform(ST_GeomFromText('{0}'), 4326) AS b),
                px_area AS (SELECT st_area(box.b) / 65536.0 AS a FROM box),
                px_length AS (SELECT sqrt(px_area.a) AS l FROM px_area),
                bufbox AS (SELECT st_buffer(box.b, px_length.l*8, 'quad_segs=1') AS buf FROM box, px_area, px_length),
                selection AS (
                    SELECT
                        st_unaryunion(st_collect(geometry)) AS __geometry__,
                        name_{1} AS __id__,
                        {2}, {3}
                    FROM gadm28, px_area, box
                    WHERE geometry && box.b
                    GROUP BY {2}, {3}
                )
            SELECT
                __geometry__, __id__, {2}, {3}
            FROM (
                (SELECT
                    ST_AsEWKB(st_intersection(
                        ST_MakeValid(ST_Simplify(__geometry__, px_length.l * 2.0)),
                        bufbox.buf
                    )) AS __geometry__,
                    __id__,
                    {2}, {3}
                FROM selection, bufbox, px_length)
            ) as Q
            WHERE __geometry__ IS NOT NULL AND NOT ST_isEmpty(__geometry__)
            """.format(
                bbox, level, names, hascs
            )

        # print SELECT
        # cursor = connection.cursor()
        cursor = connections['geodata'].cursor()
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


def gadm_data_args(data):
    gadm_data_args = {}
    gadm_data_args['level'] = int(data['level'])
    for l in range(gadm_data_args['level']):
        try:
            gadm_data_args['name_' + str(l)] = data['name_' + str(l)]
        except KeyError:
            raise ParseError(detail="name-{} not specified".format(l))
    return gadm_data_args


def gadm_data(level, distinct=True, **kwargs):
    cursor = connections['geodata'].cursor()

    field_name = "name_{}".format(level)
    distinct_clause = "DISTINCT ON (%s)" % field_name if distinct else ''
    SELECT = cursor.mogrify("""
        SELECT %s * FROM gadm28
    """, (AsIs(distinct_clause),))

    where_clause = ""
    for l in range(level):
        if l == 0:
            where_clause = cursor.mogrify("WHERE name_0 = %s", (kwargs['name_0'],))
        else:
            field_name = "name_{}".format(l)
            where_clause = \
                where_clause + \
                cursor.mogrify(" AND %s = %s", (AsIs(field_name), (kwargs['name_' + str(l)])))

    SELECT = SELECT + where_clause + " ORDER BY name_{}".format(level)

    cursor.execute(SELECT)
    print SELECT
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


@api_view(['GET'])
def gadm_json(request):
    if request.GET['level'] == '0':
        return Response([])  # Way too much data, shouldn't be needed anyway

    results = gadm_data(distinct=False, **gadm_data_args(request.GET))

    name_field = 'name_%s' % request.GET['level']
    geometries = {}

    for r in results:
        name = r[name_field]
        if name in geometries:
            geometries[name] = geometries[name].union(GEOSGeometry(r['geometry']))
        else:
            geometries[name] = GEOSGeometry(r['geometry'])

    return Response({k: v.json for k, v in geometries.items()})


def index(request):
    layers = Layer.objects.all()

    # Ordering
    if 'ordering' in request.GET and request.GET['ordering'] in ['-name', '-created']:
        ordering = request.GET['ordering']
    else:
        ordering = '-created'
    layers = layers.order_by(ordering)

    return render(request, 'layers/index.html', {
        'layers': layers,
    })


def process_shapefile(tenant, layer_id, srs):
    connection.close()
    connection.set_schema(tenant)

    l = Layer.objects.get(pk=layer_id)

    shape_path = "%s/uploads/shapefile/%s/%s.shp" % (settings.MEDIA_ROOT, tenant, l.pk)
    try:
        with fiona.open(shape_path, 'r') as collection:
            count = 0

            min_bounds = OGRGeometry(
                'POINT ({} {})'.format(collection.bounds[0], collection.bounds[1]),
                srs=srs
            ).transform(4326, clone=True)
            max_bounds = OGRGeometry(
                'POINT ({} {})'.format(collection.bounds[2], collection.bounds[3]),
                srs=srs
            ).transform(4326, clone=True)

            l.bounds = min_bounds.coords + max_bounds.coords

            features = []
            for index, record in enumerate(collection):
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

            field_names = collection.schema['properties'].keys()
            field_names.append("fid")
            l.field_names = field_names
            l.properties = collection.schema['properties']
            l.schema = collection.schema
            l.status = 0
            l.save()
    finally:
        for path in glob.glob("%s/uploads/shapefile/%s/%s.*" % (settings.MEDIA_ROOT, tenant, l.pk)):
            os.remove(path)


def process_shapefile_handler(tenant, layer_id, *args):
    connection.close()
    connection.set_schema(tenant)

    layer = Layer.objects.get(pk=layer_id)
    layer.status = 2
    layer.save()


def add(request):
    if request.method == 'POST':
        form = LayerForm(request.POST, request.FILES)

        if form.is_valid():
            l = form.save()

            col = form.get_collection()
            srs = to_string(form.layer_crs())

            shape_path = "%s/uploads/shapefile/%s/%s.shp" % (settings.MEDIA_ROOT, request.tenant.schema_name, l.pk)
            if not os.path.exists(os.path.dirname(shape_path)):
                os.makedirs(os.path.dirname(shape_path))
            with fiona.collection(shape_path, "w", schema=col.schema, crs=col.crs, driver="ESRI Shapefile") as out:
                for f in col:
                    out.write(f)

            django_rq.enqueue(process_shapefile, request.tenant.schema_name, l.pk, srs)

            messages.success(request, "Layer added.")
            return redirect('layers:index')
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


def generate_download(request, layer_id):
    layer = get_object_or_404(Layer, pk=layer_id)

    django_rq.enqueue(layer.export_to_file, request.tenant.schema_name)
    return JsonResponse({})


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


def gadm_layer_save(tenant, layer, admin_units):
    connection.close()
    connection.set_schema(tenant)

    with transaction.atomic():
        union = GEOSGeometry(admin_units[0]['geometry'])
        for i, u in enumerate(admin_units):
            geom = GEOSGeometry(u['geometry'], srid=4326)
            union = union.union(geom)
            geom.transform(3857)
            feature = Feature(
                layer=layer,
                geometry=GeometryCollection(geom),
                properties={'id': i}
            )
            feature.save()

        envelope = union.envelope.coords[0]
        layer.bounds = envelope[2] + envelope[0]
        layer.status = 0
        layer.save()


def gadm_layer_save_handler(tenant, layer, *args):
    connection.close()
    connection.set_schema(tenant)

    layer = Layer.objects.get(pk=layer.id)
    layer.status = 2
    layer.save()


class GADMView(views.APIView):
    def get(self, request):
        results = gadm_data(**gadm_data_args(request.GET))
        level = request.GET['level']
        return Response([{'name': r['name_' + level], 'id': r['id']} for r in results])

    def post(self, request):
        args = request.data
        # print args.keys()
        # results = gadm_data(distinct=False, **gadm_data_args(args))

        # field_name = 'name_%s' % request.POST['level']
        # results = [result for result in results if result[field_name] in request.POST['selected[]']]

        name = args['name']
        schema = {
            'geometry': 'Polygon',
            'properties': {
                'id': 'int:4'
            }
        }
        layer = Layer(name=name, field_names=['id'], schema=schema)
        layer.save()

        django_rq.enqueue(
            gadm_layer_save,
            request.tenant.schema_name,
            layer,
            args['features'],
            timeout=1200  # This could take a while...
        )

        return Response({'result': 'success'})

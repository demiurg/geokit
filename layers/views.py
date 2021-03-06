import timeit

import glob
import hashlib
import json
import os
from collections import OrderedDict


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
import django_filters
from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm
from serializers import FeatureSerializer, LayerSerializer

from variables.models import Variable

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
        cache_path = os.path.join(
            settings.STATIC_ROOT, "tiles", "tenant-" + str(request.tenant.pk)
        )
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
            print('tile_json', e)

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
            props['id'] = u".".join(
                [unicode(props['name_%s' % l]) for l in range(level + 1)]
            )
        except Exception as e:
            print('gadm tile json', e)

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
            if kwargs[field_name]:
                where_clause = \
                    where_clause + \
                    cursor.mogrify(" AND %s = %s", (AsIs(field_name), (kwargs[field_name])))

    SELECT = SELECT + where_clause + " ORDER BY name_{}".format(level)

    cursor.execute(SELECT)
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


@api_view(['GET'])
def gadm_feature_bounds_json(request):
    cursor = connections['geodata'].cursor()

    SELECT = cursor.mogrify("SELECT ST_Envelope(geometry) AS geom FROM gadm28 ")
    where_clause = ""
    for l in range(int(request.GET['level'])):
        if l == 0:
            where_clause = cursor.mogrify("WHERE name_0 = %s", (request.GET['name_0'],))
        else:
            field_name = "name_{}".format(l)
            if request.GET[field_name]:
                where_clause = \
                    where_clause + \
                    cursor.mogrify(" AND %s = %s", (AsIs(field_name), (request.GET[field_name])))

    SELECT = "WITH geoms AS (" + SELECT + where_clause + ") SELECT ST_AsBinary(ST_Extent(geom)) FROM geoms"

    cursor.execute(SELECT)
    bbox = GEOSGeometry(cursor.fetchall()[0][0])
    print bbox.wkt

    return Response(json.loads(bbox.json))


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
                    transformed_geom_collection = GeometryCollection(transformed_geom.geos)

                    s = hashlib.sha1()
                    s.update(transformed_geom_collection.ewkb)

                    properties = record['properties']
                    properties['fid'] = index
                    properties['shaid'] = s.hexdigest()
                    features.append(Feature(
                        layer=l,
                        geometry=transformed_geom_collection,
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

    variables_to_delete = []
    pages_to_delete = set()

    for v in Variable.objects.all():
        if layer.pk in v.root.get_layers():
            variables_to_delete.append(v)

    for v in variables_to_delete:
        for page in v.get_pages():
            pages_to_delete.add(page)

    if request.method == 'POST':
        with transaction.atomic():
            for v in variables_to_delete:
                v.delete()

            for p in pages_to_delete:
                p.delete()

            layer.delete()

        message = "Layer {0} deleted.".format(layer_name)
        if variables_to_delete:
            message = message + " Variables {0} deleted.".format(', '.join([v.name for v in variables_to_delete]))
        if pages_to_delete:
            message = message + " Pages {0} deleted.".format(', '.join([p.title for p in pages_to_delete]))
        messages.success(request, message)
        return redirect('layers:index')

    return render(request, "layers/confirm_delete.html", {
        'layer': layer,
        'variables_to_delete': variables_to_delete,
        'pages_to_delete': pages_to_delete,
    })


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
    filter_backends = (django_filters.rest_framework.DjangoFilterBackend,)
    filter_fields = ('id', 'layer__name', 'layer__status',)


class LayerViewSet(viewsets.ModelViewSet):
    queryset = Layer.objects.all()
    serializer_class = LayerSerializer
    filter_backends = (django_filters.rest_framework.DjangoFilterBackend,)
    filter_fields = ('id', 'name', 'status',)


def gadm_layer_geometries(level, features):
    cursor = connections['geodata'].cursor()

    group_by_names = ", ".join(['name_%s' % l for l in range(level + 1)])
    where_clause_values = {'name_%s' % l: set() for l in range(level + 1)}
    for f in features:
        names = f.split('.')
        for i, name in enumerate(names):
            key = 'name_{}'.format(i)
            if key in where_clause_values:
                where_clause_values[key].add(name)

    WHERE = ""
    for col, val in where_clause_values.iteritems():
        WHERE += "%s IN %s AND " % (col, cursor.mogrify("%s", [tuple(val)]))
    WHERE = WHERE[0:-5]  # Remove final `AND<space>`

    SELECT = """SELECT ST_UNARYUNION(ST_COLLECT(geometry)), %s FROM gadm28
        WHERE %s GROUP BY %s""" % (group_by_names, WHERE, group_by_names)

    cursor.execute(SELECT)

    columns = [col[0] for col in cursor.description]

    data = [
        (GEOSGeometry(bytes(row[0])), dict(zip(columns[1:], row[1:])),)
        for row in cursor.fetchall()
    ]

    return data


def gadm_layer_features_from_wkt(level, wkt):
    cursor = connections['geodata'].cursor()

    names = ",".join(['name_%s' % l for l in range(level + 1)])
    SELECT = cursor.mogrify(
        "SELECT " + names + """
            FROM gadm28
            WHERE
                ST_Contains(
                    ST_GeomFromText(%s, 4326),
                    geometry
                )
            GROUP BY """ + names, [wkt]
    )

    cursor.execute(SELECT)

    data = cursor.fetchall()

    ids = []
    for d in data:
        try:
            ids.append(".".join(d))
        except TypeError:
            fixed_id = ".".join(filter(lambda x: x, d))  # Remove instances of None
            ids.append(fixed_id)

    return ids


VECTOR_LAYERS = OrderedDict([
    ('gadm_0', {
        'name': "Global Administrative Areas Level 0 (Country)",
        'tile_layer': lambda r, z, x, y: gadm_tile_json(r, 0, z, x, y),
        'geometries_by_id': lambda features: gadm_layer_geometries(0, features),
        'features_by_wkt': lambda wkt: gadm_layer_features_from_wkt(0, wkt),
    }),
    ('gadm_1', {
        'name': "Global Administrative Areas Level 1 (State/Province)",
        'tile_layer': lambda r, z, x, y: gadm_tile_json(r, 1, z, x, y),
        'geometries_by_id': lambda features: gadm_layer_geometries(1, features),
        'features_by_wkt': lambda wkt: gadm_layer_features_from_wkt(1, wkt),
    }),
    ('gadm_2', {
        'name': "Global Administrative Areas Level 2 (County/Subprovince)",
        'tile_layer': lambda r, z, x, y: gadm_tile_json(r, 2, z, x, y),
        'geometries_by_id': lambda features: gadm_layer_geometries(2, features),
        'features_by_wkt': lambda wkt: gadm_layer_features_from_wkt(2, wkt),
    }),
])


def vector_catalog_save_layer(tenant, layer, vector_layer, features):
    connection.close()
    connection.set_schema(tenant)

    features = VECTOR_LAYERS[vector_layer]['geometries_by_id'](features)

    with transaction.atomic():
        union = GEOSGeometry('POINT EMPTY')
        keys = None
        for g, props in features:
            if not keys:
                keys = props.keys()

            union = union.union(g)
            g.transform(3857)

            s = hashlib.sha1()
            s.update(GeometryCollection(g).ewkb)
            props['shaid'] = s.hexdigest()
            f = Feature(
                layer=layer,
                geometry=GeometryCollection(g),
                properties=props
            )
            f.save()

        envelope = union.envelope.coords[0]
        layer.bounds = envelope[2] + envelope[0]
        layer.status = 0
        layer.field_names = list(set(layer.field_names).union(set(keys)))
        layer.schema['properties'] = {n: "str" for n in layer.field_names}
        layer.save()


def vector_catalog_save_layer_handler(tenant, layer, *args):
    connection.close()
    connection.set_schema(tenant)

    layer = Layer.objects.get(pk=layer.id)
    layer.status = 2
    layer.save()


def vector_catalog_tile_json(request, layer, z, x, y):
    return VECTOR_LAYERS[layer]['tile_layer'](request, z, x, y)


@api_view(['POST'])
def vector_catalog_translate_features(request, old_layer, new_layer):
    first = timeit.timeit()
    features = VECTOR_LAYERS[old_layer]['geometries_by_id'](
        request.data['features']
    )
    geometries = [g for g, props in features]
    second = timeit.timeit()
    union = GeometryCollection(*geometries).unary_union
    bbox = union.envelope
    import math
    unit = math.sqrt(bbox.area) / 40
    simpler = union.buffer(unit)
    # print bbox, unit, union.area, len(union.wkt), len(simpler.wkt)
    third = timeit.timeit()
    response = Response(
        VECTOR_LAYERS[new_layer]['features_by_wkt'](
            simpler.wkt  # bbox.wkt
        )
    )
    fourth = timeit.timeit()

    print "retrieve geoms: ", second - first
    print "union: ", third - second
    print "retrieve features: ", fourth - third
    return response


class VectorCatalogView(views.APIView):
    def get(self, request):
        vector_layers = {"layers": VECTOR_LAYERS.keys()}
        vector_layers['names'] = {k: l['name'] for k, l in VECTOR_LAYERS.items()}
        return Response(vector_layers)

    def post(self, request):
        vector_layer = request.data['layer']
        features = request.data['features']

        name = request.data['name']
        schema = {
            'geometry': 'Polygon',
            'properties': {
                'shaid': 'str'
            }
        }
        layer = Layer(name=name, field_names=['shaid'], schema=schema)
        layer.save()

        django_rq.enqueue(
            vector_catalog_save_layer,
            request.tenant.schema_name,
            layer,
            vector_layer,
            features,
            timeout=4800
        )

        return Response({'result': 'success'})

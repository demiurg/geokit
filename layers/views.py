import mimetypes
import urllib2

from django.shortcuts import redirect, render, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.conf import settings
from django.contrib.gis.geos import GeometryCollection
from django.contrib.gis.gdal import OGRGeometry
from django.http import HttpResponse

from wagtail.wagtailadmin import messages

from models import Layer, Feature
from forms import LayerForm, LayerEditForm
from utils import tile_cache

from fiona.crs import to_string
from shapely.geometry import shape
import json


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

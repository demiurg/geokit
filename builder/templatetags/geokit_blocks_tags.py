import json

from django import template
from django.core.serializers import serialize

from layers.models import Feature

register = template.Library()


@register.inclusion_tag('builder/templatetags/graph_data.html')
def graph_data(graph_block):
    variable = graph_block['variable']
    values = variable.data()
    data = {'type': None, 'values': []}

    rows, cols = values.shape
    if rows == 1:
        # Build timeseries
        data['type'] = 'timeseries'
        for i, value in enumerate(values[0]):
            date_range = variable.temporal_domain[i]
            date = date_range.lower + (date_range.upper - date_range.lower) / 2  # Get midpoint
            data['values'].append({
                'date': date.isoformat(),
                'value': value
            })
    elif cols == 1:
        # Build scatterplot by location
        features = list(Feature.objects.filter(pk__in=variable.spatial_domain).values())

        data['type'] = 'scatter'
        for i, value in enumerate(values):
            metadata = [feature for feature in features if feature['id'] == variable.spatial_key[i]][0]
            del metadata['geometry']
            data['values'].append({
                'location_id': variable.spatial_domain[i],
                'metadata': metadata,
                'value': value[0]
            })
    else:
        pass
    return {'data': json.dumps(data)}


@register.simple_tag
def map_data(map_block):
    variable = map_block['variable']
    values = variable.data()
    data = []

    rows, cols = values.shape
    if cols == 1:
        features = Feature.objects.filter(pk__in=variable.spatial_domain)

        for i, value in enumerate(values):
            geometries = [feature for feature in features if feature.pk == variable.spatial_domain[i]]
            geojson = json.loads(serialize('geojson', geometries, fields=('geometry')))
            geojson['features'][0]['properties'][map_block['expression'].name] = value[0]

            data.append(geojson['features'][0])

    return json.dumps(data)


class VariableError(Exception):
    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return str(self.msg)


@register.inclusion_tag('builder/templatetags/table_data.html')
def table_data(table_block):
    data = {}

    headers = [variable.name for variable in table_block['variables']]
    results = {variable.name: variable.data() for variable in table_block['variables']}

    try:
        data['headers'] = headers

        rows, cols = results[headers[0]].vals.shape
        if rows == 1:
            dimension = results[headers[0]].temporal_key
        elif cols == 1:
            dimension = results[headers[0]].spatial_key
        else:
            raise VariableError('Variables must be aggregated over space or time.')

        for variable, result in results.iteritems():
            if not result.dimensions_equal_to(results[headers[0]]):
                raise VariableError('All variables must have equivalent dimesions')

        data['rows'] = []
        flat_results = {name: result.vals.ravel() for name, result in results.iteritems()}
        for i in range(0, len(dimension)):
            row = []
            row.append(dimension[i])
            for header in headers:
                row.append(flat_results[header][i])

            data['rows'].append(row)

    except VariableError as e:
        data['error'] = e.msg

    return data


@register.filter
def render_with_user(block, user):
    return block.block.render(block.value, user)

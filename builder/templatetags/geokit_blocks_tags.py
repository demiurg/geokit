import json

from django import template

from layers.models import Feature

register = template.Library()


@register.inclusion_tag('builder/templatetags/graph_data.html')
def graph_data(graph_block):
    expression_result = graph_block['data']
    data = {'type': None, 'values': []}

    rows, cols = expression_result.vals.shape
    if rows == 1:
        # Build timeseries
        data['type'] = 'timeseries'
        for i, value in enumerate(expression_result.vals[0]):
            date_range = expression_result.temporal_key[i]
            date = date_range.lower + (date_range.upper - date_range.lower)/2  # Get midpoint
            data['values'].append({
                'date': date.isoformat(),
                'value': value
            })
    elif cols == 1:
        # Build scatterplot by location
        features = list(Feature.objects.filter(pk__in=expression_result.spatial_key).values())

        data['type'] = 'scatter'
        for i, value in enumerate(expression_result.vals):
            metadata = [feature for feature in features if feature['id'] == expression_result.spatial_key[i]][0]
            del metadata['geometry']
            data['values'].append({
                'location_id': expression_result.spatial_key[i],
                'metadata': metadata,
                'value': value[0]
            })
    else:
        pass
    return {'data': json.dumps(data)}


@register.filter
def render_with_user(block, user):
    return block.block.render(block.value, user)

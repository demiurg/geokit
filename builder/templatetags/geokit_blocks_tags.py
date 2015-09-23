import arrow
import random

from django import template

register = template.Library()


@register.inclusion_tag('builder/templatetags/graph_data.html')
def graph_data(graph_block):
    data = []
    for date in arrow.Arrow.range(
            'week',
            arrow.Arrow.fromdate(graph_block['start_date']),
            arrow.Arrow.fromdate(graph_block['end_date'])):
        data.append([date, (random.random() * 20)])

    return {'data': data}

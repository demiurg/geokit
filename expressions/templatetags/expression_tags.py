from django import template
from django.utils.safestring import mark_safe

from wagtail.wagtailcore.rich_text import RichText

from expressions.rich_text import expand_db_html_with_request

register = template.Library()


@register.filter
def richtext_with_expression(value, request):
    if isinstance(value, RichText):
        return value
    elif value is None:
        html = ''
    else:
        html = expand_db_html_with_request(request, value)

    return mark_safe('<div class="rich-text">' + html + '</div>')

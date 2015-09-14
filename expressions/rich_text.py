import re

from wagtail.wagtailcore.rich_text import extract_attrs, get_link_handler, get_embed_handler

from expressions.models import Expression


class ExpressionEmbedHandler(object):
    @staticmethod
    def get_db_attributes(tag):
        return {'id': tag['data-id']}

    @staticmethod
    def expand_db_attributes(attrs, for_editor, request=None):
        try:
            expression = Expression.objects.get(id=attrs['id'])

            if for_editor:
                tag_attrs = 'data-embedtype="expression" data-id="{0}"'.format(expression.id)
                value = "<code>{0}</code>".format(expression.name)
            else:
                tag_attrs = 'class="expression-result"'
                value = expression.evaluate(request)
            return "<span {0}>{1}</span>".format(tag_attrs, value)
        except Expression.DoesNotExist:
            return "<span>Expression does not exist</span>"


FIND_A_TAG = re.compile(r'<a(\b[^>]*)>')
FIND_EMBED_TAG = re.compile(r'<embed(\b[^>]*)/>')


def expand_db_html_with_request(request, html, for_editor=False):
    """
    Clone of wagtailcore.rich_text.expand_db_html, but takes and passes
    a request object through to tag/embed handlers. We need this for expression
    evaluation, as the current user is needed.
    """
    def replace_a_tag(m):
        attrs = extract_attrs(m.group(1))
        if 'linktype' not in attrs:
            return m.group(0)
        handler = get_link_handler(attrs['linktype'])
        return handler.expand_db_attributes(attrs, for_editor)

    def replace_embed_tag(m):
        attrs = extract_attrs(m.group(1))
        handler = get_embed_handler(attrs['embedtype'])
        if attrs['embedtype'] == 'expression':
            return handler.expand_db_attributes(attrs, for_editor, request=request)
        else:
            # Only the expression handler needs the request object
            return handler.expand_db_attributes(attrs, for_editor)

    html = FIND_A_TAG.sub(replace_a_tag, html)
    html = FIND_EMBED_TAG.sub(replace_embed_tag, html)
    return html

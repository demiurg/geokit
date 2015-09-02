import sympy

from expressions.models import Expression


class ExpressionEmbedHandler(object):
    @staticmethod
    def get_db_attributes(tag):
        return {'id': tag['data-id']}

    @staticmethod
    def expand_db_attributes(attrs, for_editor):
        try:
            expression = Expression.objects.get(id=attrs['id'])

            if for_editor:
                tag_attrs = 'data-embedtype="expression" data-id="{0}"'.format(expression.id)
                value = expression.expression_text
            else:
                tag_attrs = 'class="expression-result"'
                value = sympy.sympify(expression.expression_text)
            return "<span {0}><code>{1}</code></span>".format(tag_attrs, value)
        except Expression.DoesNotExist:
            return "<span>Expression does not exist</span>"

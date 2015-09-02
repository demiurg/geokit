from django.conf import settings
from django.conf.urls import url, include
from django.core.urlresolvers import reverse
from django.utils.html import format_html, format_html_join

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from expressions import admin_urls
from expressions.rich_text import ExpressionEmbedHandler


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^expressions/', include(admin_urls, namespace='expressions', app_name='expressions')),
    ]


@hooks.register('register_admin_menu_item')
def register_expressions_menu_item():
    return MenuItem('Expressions', reverse('expressions:index'), classnames="icon icon-code")


@hooks.register('register_rich_text_embed_handler')
def register_expression_embed_handler():
    return ('expression', ExpressionEmbedHandler)


@hooks.register('insert_editor_js')
def editor_js():
    js_files = [
        'js/hallo-plugins/hallo-expression-plugin.js',
        'js/expression-chooser.js',
    ]
    js_includes = format_html_join('\n', "<script src='{0}{1}'></script>",
        ((settings.STATIC_URL, filename) for filename in js_files)
    )

    return js_includes + format_html(
        """
        <script>
            window.chooserUrls.expressionChooser = '{0}';
            registerHalloPlugin('hallo-geokit-expressions');
        </script>
        """,
        reverse('expressions:chooser')
    )

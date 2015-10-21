from django.conf.urls import url, include
from django.core.urlresolvers import reverse

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from layers import admin_urls


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^layers/', include(admin_urls, namespace='layers', app_name='layers')),
    ]


@hooks.register('register_admin_menu_item')
def register_layers_menu_item():
    return MenuItem('Layers', reverse('layers:index'), classnames="icon icon-site")

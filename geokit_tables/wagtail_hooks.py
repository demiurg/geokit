from django.conf.urls import url, include
from django.core.urlresolvers import reverse

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from geokit_tables import admin_urls


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^tables/', include(admin_urls, namespace='geokit_tables', app_name='tables')),
    ]


@hooks.register('register_admin_menu_item')
def register_tables_menu_item():
    return MenuItem('Tables', reverse('geokit_tables:index'), classnames="icon icon-form")

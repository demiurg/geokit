from django.conf.urls import url, include
from django.core.urlresolvers import reverse

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from variables import admin_urls


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^variables/', include(admin_urls, namespace='variables', app_name='variables')),
    ]


@hooks.register('register_admin_menu_item')
def register_variables_menu_item():
    return MenuItem('Variables', reverse('variables:index'), classnames="icon icon-placeholder")

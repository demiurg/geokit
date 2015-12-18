from django.conf.urls import url, include
from django.core.urlresolvers import reverse

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from sieve import admin_urls


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^sieve/', include(admin_urls, namespace='sieve', app_name='sieve')),
    ]


@hooks.register('register_admin_menu_item')
def register_sieve_menu_item():
    return MenuItem('Sieve', reverse('sieve:index'), classnames="icon icon-placeholder")

from django.conf.urls import url, include
from django.shortcuts import render
from django.core.urlresolvers import reverse

from wagtail.wagtailcore import hooks
from wagtail.wagtailadmin.menu import MenuItem

from variables import admin_urls

def site_guide(request):
    return render(request, 'variables/site_guide.html')


@hooks.register('register_admin_urls')
def register_admin_urls():
    return [
        url('^variables/', include(admin_urls, namespace='variables', app_name='variables')),
        url('^site-guide/', site_guide, name='site_guide'),
    ]


@hooks.register('register_admin_menu_item')
def register_variables_menu_item():
    return MenuItem('Variables', reverse('variables:index'), classnames="icon icon-placeholder")

@hooks.register('register_admin_menu_item')
def register_user_guide_menu_item():
    return MenuItem('Site Guide', reverse('site_guide'), classnames="icon icon-placeholder")
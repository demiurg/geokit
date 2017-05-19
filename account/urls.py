from django.conf.urls import url, include
from django.contrib import admin

from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    url(r'^$', views.index, name='home'),
    url(r'^about/?$', views.about, name='about'),
    url(r'^site-guide/?$', views.site_guide, name='site_guide'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^availability/(\w+)/', views.availability, name='availability'),
    url(r'^site/create/', views.site_create, name='site_create'),
    url(r'^site/edit/(\w+)/', views.site_edit, name='site_edit'),
    url(r'^site/delete/(\w+)/', views.site_delete, name='site_delete'),

    url(r'^login/$', views.login, name='login'),
    url(r'^logout/$', auth_views.logout_then_login, name="logout"),

    url(r'^signup/$', views.signup, name='signup'),

    url(r'^password/change/$', auth_views.password_change, {'template_name': 'account/password_change_form.html'}, name='password_change'),
    url(r'^password/done/$', auth_views.password_change_done, {'template_name': 'account/password_change_done.html'}, name='password_change_done'),

    url(r'^reset/$', auth_views.password_reset, {'template_name': 'account/password_reset_form.html'}, name='password_reset'),
    url(r'^reset/done/$', auth_views.password_reset_done, {'template_name': 'account/password_reset_done.html'}, name='password_reset_done'),
    url(r'^reset/token/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>.+)/$', auth_views.password_reset_confirm, {'template_name': 'account/password_reset_confirm.html'}, name='password_reset_confirm'),
    url(r'^reset/complete/$', auth_views.password_reset_complete, {'template_name': 'account/password_reset_complete.html'}, name='password_reset_complete'),
]

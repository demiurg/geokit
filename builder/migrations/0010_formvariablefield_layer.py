# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0006_auto_20151009_2107'),
        ('builder', '0009_auto_20151201_2011'),
    ]

    operations = [
        migrations.AddField(
            model_name='formvariablefield',
            name='layer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='layers.Layer', null=True),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2017-03-08 19:03
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0005_auto_20170308_1833'),
    ]

    operations = [
        migrations.AlterField(
            model_name='layerfile',
            name='layer',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='layers.Layer'),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2016-11-09 00:53
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('geokit_tables', '0002_auto_20161108_1944'),
    ]

    operations = [
        migrations.AddField(
            model_name='geokittable',
            name='schema',
            field=django.contrib.postgres.fields.jsonb.JSONField(null=True),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-08 20:13
from __future__ import unicode_literals

import django.contrib.postgres.fields.ranges
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('geokit_tables', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='record',
            name='date',
            field=django.contrib.postgres.fields.ranges.DateRangeField(null=True),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-01 16:05
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0006_auto_20160825_2124'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variable',
            name='spatial_domain',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), null=True, size=None),
        ),
        migrations.AlterField(
            model_name='variable',
            name='temporal_domain',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.DateField(), null=True, size=None),
        ),
    ]
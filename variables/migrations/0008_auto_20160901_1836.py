# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-09-01 18:36
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0007_auto_20160901_1605'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variable',
            name='spatial_domain',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), blank=True, null=True, size=None),
        ),
        migrations.AlterField(
            model_name='variable',
            name='temporal_domain',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.DateField(), blank=True, null=True, size=None),
        ),
        migrations.AlterField(
            model_name='variable',
            name='units',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-09 17:35
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0002_auto_20160229_2141'),
    ]

    operations = [
        migrations.AddField(
            model_name='layer',
            name='field_names',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.TextField(), null=True, size=None),
        ),
    ]

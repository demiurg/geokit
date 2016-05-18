# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-05-17 18:40
from __future__ import unicode_literals

import django.contrib.postgres.fields
import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0006_expression_units'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expression',
            name='filters',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.jsonb.JSONField(), blank=True, null=True, size=None),
        ),
    ]
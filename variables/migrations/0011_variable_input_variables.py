# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-25 21:06
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0010_auto_20161014_1932'),
    ]

    operations = [
        migrations.AddField(
            model_name='variable',
            name='input_variables',
            field=django.contrib.postgres.fields.jsonb.JSONField(null=True),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-05-18 15:24
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0007_auto_20160517_1840'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='expression',
            name='filters'
        ),
        migrations.AddField(
            model_name='expression',
            name='filters',
            field=django.contrib.postgres.fields.jsonb.JSONField(default=[]),
        ),
    ]

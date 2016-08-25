# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-01 20:41
from __future__ import unicode_literals

from django.db import migrations, models


record_dates = []


def get_dates(apps, schema_editor):
    Record = apps.get_model('geokit_tables', 'Record')
    for r in Record.objects.all():
        record_dates.append((r.pk, r.date.lower))


def apply_dates(apps, schema_editor):
    Record = apps.get_model('geokit_tables', 'Record')
    for d in record_dates:
        r = Record.objects.get(pk=d[0])
        r.date = d[1]
        r.save()


class Migration(migrations.Migration):

    dependencies = [
        ('geokit_tables', '0003_geokittable_field_names'),
    ]

    operations = [
        migrations.RunPython(get_dates),
        migrations.RemoveField(
            model_name='record',
            name='date',
        ),
        migrations.AddField(
            model_name='record',
            name='date',
            field=models.DateField(null=True),
        ),
        migrations.RunPython(apply_dates),
    ]
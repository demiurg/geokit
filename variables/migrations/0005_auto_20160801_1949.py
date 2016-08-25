# -*- coding: utf-8 -*-
# Generated by Django 1.9.8 on 2016-08-01 19:49
from __future__ import unicode_literals

import django.contrib.postgres.fields
from django.db import migrations, models


variable_t_domains = []


def get_dates(apps, schema_editor):
    Variable = apps.get_model('variables', 'Variable')
    for v in Variable.objects.all():
        dates = [d.lower for d in v.temporal_domain]
        variable_t_domains.append((v.pk, dates))


def apply_dates(apps, schema_editor):
    Variable = apps.get_model('variables', 'Variable')
    for domain in variable_t_domains:
        v = Variable.objects.get(pk=domain[0])
        v.temporal_domain = domain[1]
        v.save()


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0004_auto_20160706_1801'),
    ]

    operations = [
        migrations.RunPython(get_dates),
        migrations.RemoveField(
            model_name='variable',
            name='temporal_domain',
        ),
        migrations.AddField(
            model_name='variable',
            name='temporal_domain',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.DateField(), size=None),
        ),
        migrations.RunPython(apply_dates),
    ]
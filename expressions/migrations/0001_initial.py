# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-02-17 16:46
from __future__ import unicode_literals

from django.conf import settings
import django.contrib.postgres.fields
import django.contrib.postgres.fields.hstore
import django.contrib.postgres.fields.ranges
from django.db import migrations, models
import django.db.models.deletion
import expressions.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('layers', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Expression',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('expression_text', models.TextField(validators=[expressions.models.validate_expression_text])),
                ('temporal_domain', django.contrib.postgres.fields.ranges.DateRangeField(blank=True, null=True)),
                ('filters', django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.hstore.HStoreField(), blank=True, null=True, size=None)),
                ('spatial_domain_features', models.ManyToManyField(blank=True, to='layers.Feature')),
            ],
        ),
        migrations.CreateModel(
            name='FormVariable',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('value', models.TextField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

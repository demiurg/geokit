# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-21 18:46
from __future__ import unicode_literals

import django.contrib.postgres.fields
import django.contrib.postgres.fields.ranges
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('geokit_tables', '0003_geokittable_field_names'),
        ('expressions', '0009_auto_20160608_2013'),
        ('layers', '0003_layer_field_names'),
    ]

    operations = [
        migrations.CreateModel(
            name='DataSource',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_type', models.CharField(choices=[('variabledatasource', 'Variable'), ('expressiondatasource', 'Expression'), ('uploadsdatasource', 'Uploads')], max_length=20)),
            ],
        ),
        migrations.CreateModel(
            name='Variable',
            fields=[
                ('name', models.CharField(max_length=75, primary_key=True, serialize=False)),
                ('temporal_domain', django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.ranges.DateRangeField(), size=None)),
                ('spatial_domain', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(), size=None)),
                ('units', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='ExpressionDataSource',
            fields=[
                ('datasource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='variables.DataSource')),
                ('expression', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='expressions.Expression')),
            ],
            bases=('variables.datasource',),
        ),
        migrations.CreateModel(
            name='UploadsDataSource',
            fields=[
                ('datasource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='variables.DataSource')),
                ('layer_join_field', models.CharField(max_length=200)),
                ('table_join_field', models.CharField(max_length=200)),
                ('layer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='layers.Layer')),
                ('table', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='geokit_tables.GeoKitTable')),
            ],
            bases=('variables.datasource',),
        ),
        migrations.CreateModel(
            name='VariableDataSource',
            fields=[
                ('datasource_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='variables.DataSource')),
            ],
            bases=('variables.datasource',),
        ),
        migrations.AddField(
            model_name='variable',
            name='data_source',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='variables.DataSource'),
        ),
        migrations.AddField(
            model_name='variabledatasource',
            name='parent_variable',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='variables.Variable'),
        ),
    ]
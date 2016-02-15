# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.postgres.fields
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Feature',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('geometry', django.contrib.gis.db.models.fields.GeometryCollectionField(srid=4326)),
                ('attributes', django.contrib.postgres.fields.HStoreField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Layer',
            fields=[
                ('name', models.CharField(max_length=250, serialize=False, primary_key=True)),
                ('description', models.TextField(null=True, blank=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('modified', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddField(
            model_name='feature',
            name='layer',
            field=models.ForeignKey(to='layers.Layer'),
        ),
    ]

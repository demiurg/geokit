# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0005_auto_20151008_1752'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feature',
            name='geometry',
            field=django.contrib.gis.db.models.fields.GeometryCollectionField(srid=3857),
        ),
    ]

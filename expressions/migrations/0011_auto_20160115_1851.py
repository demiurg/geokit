# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.postgres.fields
import django.contrib.postgres.fields.hstore
import django.contrib.postgres.fields.ranges


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0006_auto_20151009_2107'),
        ('expressions', '0010_auto_20151204_1553'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='expression',
            name='expression_type',
        ),
        migrations.RemoveField(
            model_name='expression',
            name='input_collection',
        ),
        migrations.AddField(
            model_name='expression',
            name='filters',
            field=django.contrib.postgres.fields.ArrayField(size=None, null=True, base_field=django.contrib.postgres.fields.hstore.HStoreField(), blank=True),
        ),
        migrations.AddField(
            model_name='expression',
            name='spatial_domain_features',
            field=models.ManyToManyField(to='layers.Feature', blank=True),
        ),
        migrations.AddField(
            model_name='expression',
            name='temporal_domain',
            field=django.contrib.postgres.fields.ranges.DateRangeField(null=True, blank=True),
        ),
    ]

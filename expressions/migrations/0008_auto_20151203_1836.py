# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0006_auto_20151009_2107'),
        ('expressions', '0007_auto_20150914_2041'),
    ]

    operations = [
        migrations.AddField(
            model_name='expression',
            name='expression_type',
            field=models.CharField(default='arith', max_length=6, choices=[(b'arith', b'arithmetic'), (b'filter', b'filter'), (b'map', b'map'), (b'reduce', b'reduce')]),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='expression',
            name='input_collection',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='layers.Layer', null=True),
        ),
    ]

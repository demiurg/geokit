# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0009_auto_20151204_1544'),
    ]

    operations = [
        migrations.AddField(
            model_name='expression',
            name='input_collection',
            field=models.ForeignKey(on_delete=django.db.models.SET_NULL, blank=True, to='expressions.Expression', null=True),
        ),
    ]

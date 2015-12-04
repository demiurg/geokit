# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0008_auto_20151203_1836'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expression',
            name='expression_type',
            field=models.CharField(max_length=6, choices=[(b'arith', b'arithmetic'), (b'collec', b'form variable collection'), (b'filter', b'filter'), (b'map', b'map'), (b'reduce', b'reduce')]),
        ),
        migrations.RemoveField(
            model_name='expression',
            name='input_collection'
        ),
    ]

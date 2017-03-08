# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2017-03-08 17:47
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0005_auto_20170227_1407'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variable',
            name='status',
            field=models.IntegerField(choices=[(0, 'Good'), (1, 'Working'), (3, 'Bad')], default=0),
        ),
    ]
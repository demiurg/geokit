# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-14 19:32
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0009_variable_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variable',
            name='name',
            field=models.SlugField(max_length=75, primary_key=True, serialize=False),
        ),
    ]

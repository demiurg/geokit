# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0003_auto_20151007_1622'),
    ]

    operations = [
        migrations.AlterField(
            model_name='layer',
            name='name',
            field=models.SlugField(max_length=250, serialize=False, primary_key=True),
        ),
    ]

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.contrib.postgres.fields


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0004_auto_20151007_2037'),
    ]

    operations = [
        migrations.AddField(
            model_name='layer',
            name='bounds',
            field=django.contrib.postgres.fields.ArrayField(null=True, base_field=models.FloatField(), size=4),
        ),
        migrations.AlterField(
            model_name='layer',
            name='name',
            field=models.SlugField(help_text=b'The name of the layer as it will appear in URLs e.g http://domain.com/blog/my-slug/ and expressions e.g map(my-slug)', max_length=250, serialize=False, primary_key=True),
        ),
    ]

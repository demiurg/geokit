# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='layer',
            name='status',
            field=models.IntegerField(default=1, choices=[(0, b'Good'), (1, b'Working'), (3, b'Bad')]),
        ),
    ]

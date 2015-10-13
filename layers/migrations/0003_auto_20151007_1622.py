# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('layers', '0002_layer_status'),
    ]

    operations = [
        migrations.RenameField(
            model_name='feature',
            old_name='attributes',
            new_name='properties',
        ),
    ]

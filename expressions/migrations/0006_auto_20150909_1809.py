# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0005_formvariable'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='formvariable',
            unique_together=set([('name', 'user')]),
        ),
    ]

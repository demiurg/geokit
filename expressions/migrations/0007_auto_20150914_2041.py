# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0006_auto_20150909_1809'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='formvariable',
            unique_together=set([]),
        ),
    ]

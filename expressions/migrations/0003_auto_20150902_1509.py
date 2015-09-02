# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import expressions.validators


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0002_auto_20150901_1703'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expression',
            name='expression_text',
            field=models.TextField(validators=[expressions.validators.validate_expression_text]),
        ),
    ]

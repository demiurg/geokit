# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import expressions.models


class Migration(migrations.Migration):

    dependencies = [
        ('expressions', '0003_auto_20150902_1509'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expression',
            name='expression_text',
            field=models.TextField(validators=[expressions.models.validate_expression_text]),
        ),
    ]

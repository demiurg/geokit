# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2017-05-01 20:46
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0004_membership'),
    ]

    operations = [
        migrations.AddField(
            model_name='geokitsite',
            name='status',
            field=models.CharField(choices=[(b'active', b'Active'), (b'disabled', b'Disabled')], default=b'active', max_length=15),
        ),
    ]
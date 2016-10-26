# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2016-10-25 18:06
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('variables', '0010_auto_20161014_1932'),
    ]

    operations = [
        migrations.CreateModel(
            name='Result',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('band', models.CharField(max_length=255)),
                ('count', models.IntegerField(blank=True, null=True)),
                ('date', models.DateField()),
                ('maximum', models.FloatField(blank=True, null=True)),
                ('mean', models.FloatField(blank=True, null=True)),
                ('skew', models.FloatField(blank=True, null=True)),
                ('minimum', models.FloatField(blank=True, null=True)),
                ('product', models.CharField(max_length=255)),
                ('sd', models.FloatField(blank=True, null=True)),
                ('fid', models.IntegerField()),
            ],
        ),
    ]

# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import modelcluster.fields


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0004_auto_20150904_1909'),
    ]

    operations = [
        migrations.CreateModel(
            name='FormVariableField',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('sort_order', models.IntegerField(null=True, editable=False, blank=True)),
                ('label', models.CharField(help_text='The label of the form field', max_length=255, verbose_name='Label')),
                ('field_type', models.CharField(max_length=16, verbose_name='Field type', choices=[('singleline', 'Single line text'), ('multiline', 'Multi-line text'), ('email', 'Email'), ('number', 'Number'), ('url', 'URL'), ('checkbox', 'Checkbox'), ('checkboxes', 'Checkboxes'), ('dropdown', 'Drop down'), ('radio', 'Radio buttons'), ('date', 'Date'), ('datetime', 'Date/time')])),
                ('required', models.BooleanField(default=True, verbose_name='Required')),
                ('choices', models.CharField(help_text='Comma separated list of choices. Only applicable in checkboxes, radio and dropdown.', max_length=512, verbose_name='Choices', blank=True)),
                ('default_value', models.CharField(help_text='Default value. Comma separated values supported for checkboxes.', max_length=255, verbose_name='Default value', blank=True)),
                ('help_text', models.CharField(max_length=255, verbose_name='Help text', blank=True)),
                ('variable_name', models.CharField(max_length=100)),
                ('page', modelcluster.fields.ParentalKey(related_name='form_fields', to='builder.CustomFormPage')),
            ],
            options={
                'ordering': ['sort_order'],
                'abstract': False,
            },
        ),
        migrations.RemoveField(
            model_name='formfield',
            name='page',
        ),
        migrations.DeleteModel(
            name='FormField',
        ),
    ]

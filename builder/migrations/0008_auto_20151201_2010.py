# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.wagtailimages.blocks
import wagtail.wagtailcore.fields
import wagtail.wagtailcore.blocks
import wagtail.wagtailembeds.blocks
import expressions.blocks
import layers.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0007_auto_20150924_2043'),
    ]

    operations = [
        migrations.AddField(
            model_name='formvariablefield',
            name='geokit_field_type',
            field=models.CharField(default='char_field', max_length=16, verbose_name='Field Type', choices=[('singleline', 'Single line text'), ('multiline', 'Multi-line text'), ('email', 'Email'), ('number', 'Number'), ('url', 'URL'), ('checkbox', 'Checkbox'), ('checkboxes', 'Checkboxes'), ('dropdown', 'Drop down'), ('radio', 'Radio buttons'), ('date', 'Date'), ('datetime', 'Date/time'), ('map_select', 'Map Select'), ('map_multi_select', 'Map Multiple Select')]),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField([('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('embed', wagtail.wagtailembeds.blocks.EmbedBlock()), ('graph', wagtail.wagtailcore.blocks.StructBlock([(b'start_date', wagtail.wagtailcore.blocks.DateBlock()), (b'end_date', wagtail.wagtailcore.blocks.DateBlock())])), ('map', wagtail.wagtailcore.blocks.StructBlock([(b'layer', layers.blocks.LayerChooserBlock()), (b'expression', expressions.blocks.ExpressionChooserBlock()), (b'color_ramp', wagtail.wagtailcore.blocks.ListBlock(wagtail.wagtailcore.blocks.StructBlock([(b'min_value', wagtail.wagtailcore.blocks.CharBlock()), (b'max_value', wagtail.wagtailcore.blocks.CharBlock()), (b'color', wagtail.wagtailcore.blocks.CharBlock())])))]))]),
        ),
    ]

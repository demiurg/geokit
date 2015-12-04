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
        ('builder', '0010_formvariablefield_layer'),
    ]

    operations = [
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField([('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('embed', wagtail.wagtailembeds.blocks.EmbedBlock()), ('graph', wagtail.wagtailcore.blocks.StructBlock([(b'start_date', wagtail.wagtailcore.blocks.DateBlock()), (b'end_date', wagtail.wagtailcore.blocks.DateBlock())])), ('map', wagtail.wagtailcore.blocks.StructBlock([(b'layer', layers.blocks.LayerChooserBlock()), (b'expression', expressions.blocks.ExpressionChooserBlock()), (b'color_ramp', wagtail.wagtailcore.blocks.ListBlock(wagtail.wagtailcore.blocks.StructBlock([(b'min_value', wagtail.wagtailcore.blocks.CharBlock()), (b'max_value', wagtail.wagtailcore.blocks.CharBlock()), (b'color', wagtail.wagtailcore.blocks.CharBlock())])))])), ('table', wagtail.wagtailcore.blocks.StructBlock([(b'form_variable', wagtail.wagtailcore.blocks.CharBlock()), (b'columns', wagtail.wagtailcore.blocks.CharBlock())]))]),
        ),
    ]

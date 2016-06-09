# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-06-08 20:13
from __future__ import unicode_literals

from django.db import migrations
import expressions.blocks
import layers.blocks
import wagtail.wagtailcore.blocks
import wagtail.wagtailcore.fields
import wagtail.wagtailembeds.blocks
import wagtail.wagtailimages.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField([('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('embed', wagtail.wagtailembeds.blocks.EmbedBlock()), ('graph', wagtail.wagtailcore.blocks.StructBlock([(b'variable', expressions.blocks.ExpressionChooserBlock())])), ('map', wagtail.wagtailcore.blocks.StructBlock([(b'layer', layers.blocks.LayerChooserBlock()), (b'expression', expressions.blocks.ExpressionChooserBlock()), (b'color_ramp', wagtail.wagtailcore.blocks.ListBlock(wagtail.wagtailcore.blocks.StructBlock([(b'min_value', wagtail.wagtailcore.blocks.CharBlock()), (b'max_value', wagtail.wagtailcore.blocks.CharBlock()), (b'color', wagtail.wagtailcore.blocks.CharBlock())])))])), ('table', wagtail.wagtailcore.blocks.StructBlock([(b'expression', expressions.blocks.ExpressionChooserBlock())]))]),
        ),
    ]

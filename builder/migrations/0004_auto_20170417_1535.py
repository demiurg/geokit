# -*- coding: utf-8 -*-
# Generated by Django 1.10 on 2017-04-17 15:35
from __future__ import unicode_literals

import builder.blocks
from django.db import migrations
import wagtail.wagtailcore.blocks
import wagtail.wagtailcore.fields
import wagtail.wagtailembeds.blocks
import wagtail.wagtailimages.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0003_auto_20170227_1441'),
    ]

    operations = [
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField([('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('embed', wagtail.wagtailembeds.blocks.EmbedBlock()), ('visualization', wagtail.wagtailcore.blocks.StructBlock([(b'visualizations', wagtail.wagtailcore.blocks.ListBlock(builder.blocks.VisualizationBlock))]))]),
        ),
    ]
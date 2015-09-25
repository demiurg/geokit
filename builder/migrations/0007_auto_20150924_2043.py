# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import wagtail.wagtailembeds.blocks
import wagtail.wagtailcore.blocks
import wagtail.wagtailcore.fields
import wagtail.wagtailimages.blocks


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0006_customformpage_redirect_page'),
    ]

    operations = [
        migrations.AlterField(
            model_name='custompage',
            name='body',
            field=wagtail.wagtailcore.fields.StreamField((('paragraph', wagtail.wagtailcore.blocks.RichTextBlock()), ('image', wagtail.wagtailimages.blocks.ImageChooserBlock()), ('embed', wagtail.wagtailembeds.blocks.EmbedBlock()), ('graph', wagtail.wagtailcore.blocks.StructBlock((('start_date', wagtail.wagtailcore.blocks.DateBlock()), ('end_date', wagtail.wagtailcore.blocks.DateBlock())))), ('map', wagtail.wagtailcore.blocks.StructBlock((('bbox', wagtail.wagtailcore.blocks.CharBlock()),))))),
        ),
    ]

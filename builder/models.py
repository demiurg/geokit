from __future__ import unicode_literals

from modelcluster.fields import ParentalKey

from django.apps import apps
from django.contrib.gis.db import models
from django.shortcuts import render, redirect

from wagtail.wagtailcore import blocks
from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import RichTextField, StreamField
from wagtail.wagtailadmin.edit_handlers import FieldPanel, StreamFieldPanel, InlinePanel, PageChooserPanel
from wagtail.wagtailembeds.blocks import EmbedBlock
from wagtail.wagtailforms.models import AbstractFormField, FORM_FIELD_CHOICES
from wagtail.wagtailimages.blocks import ImageChooserBlock

from builder.blocks import GraphBlock, MapBlock, TableBlock
from builder.forms import GeoKitFormBuilder


GEOKIT_FORM_FIELD_CHOICES = FORM_FIELD_CHOICES + (
    ('map_select', 'Map Select'),
    ('map_multi_select', 'Map Multiple Select'),
)


class HomePage(Page):
    body = RichTextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel('body', classname="full"),
    ]


class CustomPage(Page):
    body = StreamField([
        ('paragraph', blocks.RichTextBlock()),
        ('image', ImageChooserBlock()),
        ('embed', EmbedBlock()),
        ('graph', GraphBlock()),
        ('map', MapBlock()),
        ('table', TableBlock()),
    ])

    content_panels = [
        FieldPanel('title'),
        StreamFieldPanel('body'),
    ]


class FormVariableField(AbstractFormField):
    page = ParentalKey('CustomFormPage', related_name='form_fields')
    variable_name = models.CharField(max_length=100)
    geokit_field_type = models.CharField(verbose_name='Field Type', max_length=16, choices=GEOKIT_FORM_FIELD_CHOICES)
    layer = models.ForeignKey('layers.Layer', on_delete=models.SET_NULL, blank=True, null=True)

    panels = [
        FieldPanel('variable_name'),
        FieldPanel('geokit_field_type', classname="formbuilder-type"),
        FieldPanel('layer'),
    ]

    def save(self, *args, **kwargs):
        self.label = self.variable_name
        super(FormVariableField, self).save(*args, **kwargs)

    def __unicode__(self):
        return "<FormVariableField: {}>".format(self.field_type)


class CustomFormPage(CustomPage):
    redirect_page = models.ForeignKey(
        'wagtailcore.Page',
        null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')

    def serve(self, request):
        fb = GeoKitFormBuilder(self.form_fields.all())
        form_class = fb.get_form_class()

        if request.method == "POST":
            form = form_class(request.POST)

            if form.is_valid():
                # Save form variables
                for var, value in form.cleaned_data.items():
                    # Currently, this saves model instances (such as Features)
                    # serialized using their unicode representations. Maybe this
                    # should be less hacky?
                    FormVariable = apps.get_model(app_label='expressions', model_name='FormVariable')
                    var = FormVariable(name=var, value=value, user=request.user)
                    var.save()

                return redirect(self.redirect_page.url)
        else:
            form = form_class()

        return render(request, self.template, {
            'self': self,
            'form': form,
        })

    content_panels = CustomPage.content_panels + [
        InlinePanel('form_fields', label="Form fields"),
        PageChooserPanel('redirect_page'),
    ]

from __future__ import unicode_literals

from modelcluster.fields import ParentalKey

from django.apps import apps
from django.db import models
from django.shortcuts import render, redirect

from wagtail.wagtailcore import blocks
from wagtail.wagtailcore.models import Page
from wagtail.wagtailcore.fields import RichTextField, StreamField
from wagtail.wagtailadmin.edit_handlers import FieldPanel, StreamFieldPanel, InlinePanel, PageChooserPanel
from wagtail.wagtailembeds.blocks import EmbedBlock
from wagtail.wagtailforms.forms import FormBuilder
from wagtail.wagtailforms.models import AbstractFormField
from wagtail.wagtailimages.blocks import ImageChooserBlock

from builder.blocks import GraphBlock


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
    ])

    content_panels = [
        FieldPanel('title'),
        StreamFieldPanel('body'),
    ]


class FormVariableField(AbstractFormField):
    page = ParentalKey('CustomFormPage', related_name='form_fields')
    variable_name = models.CharField(max_length=100)

    panels = [
        FieldPanel('variable_name'),
        FieldPanel('field_type', classname="formbuilder-type"),
    ]

    def save(self, *args, **kwargs):
        self.label = self.variable_name
        super(FormVariableField, self).save(*args, **kwargs)


class CustomFormPage(CustomPage):
    redirect_page = models.ForeignKey(
        'wagtailcore.Page',
        null=True, blank=True,
        on_delete=models.SET_NULL, related_name='+')

    def serve(self, request):
        fb = FormBuilder(self.form_fields.all())
        form_class = fb.get_form_class()

        if request.method == "POST":
            form = form_class(request.POST)

            if form.is_valid():
                # Save form variables
                for var, value in form.cleaned_data.items():
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

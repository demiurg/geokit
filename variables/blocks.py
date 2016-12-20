from django import forms
from django.utils.functional import cached_property

from wagtail.wagtailcore.blocks import ChooserBlock


class VariableChooserBlock(ChooserBlock):
    @cached_property
    def target_model(self):
        from variables.models import Variable
        return Variable

    @cached_property
    def widget(self):
        return forms.Select

    def value_for_form(self, value):
        if isinstance(value, self.target_model):
            return value.pk
        else:
            return value

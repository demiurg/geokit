from django.utils.functional import cached_property

from wagtail.wagtailcore.blocks import ChooserBlock


class VariableChooserBlock(ChooserBlock):
    @cached_property
    def target_model(self):
        from variables.models import Variable
        return Variable

    @cached_property
    def widget(self):
        pass

    def get_prep_value(self, variable):
        return variable.pk

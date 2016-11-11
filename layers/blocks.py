from django.utils.functional import cached_property

from wagtail.wagtailcore.blocks import ChooserBlock


class LayerChooserBlock(ChooserBlock):
    @cached_property
    def target_model(self):
        from layers.models import Layer
        return Layer

    @cached_property
    def widget(self):
        pass

    def get_prep_value(self, layer):
        if layer is None:
            return None
        else:
            return layer.pk

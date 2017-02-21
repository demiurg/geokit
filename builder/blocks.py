import uuid

from django.forms import CharField

from wagtail.wagtailcore.blocks import CharBlock, ChoiceBlock, FieldBlock, ListBlock, StructBlock

from builder.widgets import ColorWidget
from variables.blocks import VariableChooserBlock


# Inherits from StructBlock to reuse form rendering logic.
class GraphBlock(StructBlock):
    variable = VariableChooserBlock()

    class Meta:
        template = 'builder/blocks/graph.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = uuid.uuid4()

        return super(GraphBlock, self).render(value)


class ColorBlock(FieldBlock):
    def __init__(self, required=True, *args, **kwargs):
        self.field = CharField(widget=ColorWidget)
        super(ColorBlock, self).__init__(*args, **kwargs)


class ColorStopBlock(StructBlock):
    value = CharBlock()
    color = ColorBlock()


class MapBlock(StructBlock):
    variable = VariableChooserBlock()
    color_ramp = ListBlock(ColorStopBlock())

    class Meta:
        template = 'builder/blocks/map.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = uuid.uuid4()

        return super(MapBlock, self).render(value)


class TableBlock(StructBlock):
    variable = VariableChooserBlock()

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = uuid.uuid4()

        return super(TableBlock, self).render(value)


class VisualizationControlBlock(StructBlock):
    vis_type = ChoiceBlock(choices=[
        ('map', 'Map'),
        ('slider', 'Date Slider'),
    ])


class VisualizationBlock(StructBlock):
    vis_type = ChoiceBlock(choices=[
        ('map', 'Map'),
        ('graph', 'Graph'),
        ('table', 'Table'),
    ])
    variable = VariableChooserBlock()


class VisualizationGroupBlock(StructBlock):
    control = VisualizationControlBlock()
    visualizations = ListBlock(VisualizationBlock)

    class Meta:
        template = 'builder/blocks/visualization.html'

    def render(self, value):
        # Iterate through vis blocks and grab variable dimensions.
        # Validate that they have a common dimension, and then pass
        # the union of their dimensions to the VisGroup react component.
        return super(VisualizationGroupBlock, self).render(value)

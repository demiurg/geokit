import uuid

from wagtail.wagtailcore.blocks import CharBlock, ListBlock, StructBlock

from layers.blocks import LayerChooserBlock
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


class ColorValueBlock(StructBlock):
    min_value = CharBlock()
    max_value = CharBlock()
    color = CharBlock()


class MapBlock(StructBlock):
    layer = LayerChooserBlock()
    variable = VariableChooserBlock()
    color_ramp = ListBlock(ColorValueBlock())

    class Meta:
        template = 'builder/blocks/map.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = uuid.uuid4()

        return super(MapBlock, self).render(value)


class TableBlock(StructBlock):
    variables = ListBlock(VariableChooserBlock())

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = uuid.uuid4()

        return super(TableBlock, self).render(value)

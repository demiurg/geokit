import uuid

from wagtail.wagtailcore.blocks import CharBlock, ListBlock, StructBlock

from expressions.blocks import ExpressionChooserBlock
from layers.blocks import LayerChooserBlock


# Inherits from StructBlock to reuse form rendering logic.
class GraphBlock(StructBlock):
    variable = ExpressionChooserBlock()

    class Meta:
        template = 'builder/blocks/graph.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = uuid.uuid4()
        value["data"] = value["variable"].evaluate(None)

        return super(GraphBlock, self).render(value)


class ColorValueBlock(StructBlock):
    min_value = CharBlock()
    max_value = CharBlock()
    color = CharBlock()


class MapBlock(StructBlock):
    layer = LayerChooserBlock()
    expression = ExpressionChooserBlock()
    color_ramp = ListBlock(ColorValueBlock())

    class Meta:
        template = 'builder/blocks/map.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = uuid.uuid4()
        value["data"] = value["expression"].evaluate(None)

        return super(MapBlock, self).render(value)


class TableBlock(StructBlock):
    variables = ListBlock(ExpressionChooserBlock())

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = uuid.uuid4()

        return super(TableBlock, self).render(value)

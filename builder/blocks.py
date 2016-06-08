import random

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
        value["id"] = random.randint(1, 1000)  # Used to give each div a unique id, should be done a better way
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
        value["id"] = random.randint(1, 1000)
        value["data"] = value["expression"].evaluate(None)

        return super(MapBlock, self).render(value)


class TableBlock(StructBlock):
    expression = ExpressionChooserBlock()

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = random.randint(1, 1000)
        value['variable_result'] = value['expression'].evaluate(None)
        value['keys'] = value['variable_result'].vals[0][0].keys()
        return super(TableBlock, self).render(value)

import random

from wagtail.wagtailcore.blocks import CharBlock, DateBlock, ListBlock, StructBlock

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

        return super(MapBlock, self).render(value)


class TableBlock(StructBlock):
    expression = ExpressionChooserBlock()
    columns = CharBlock()

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = random.randint(1, 1000)
        value['columns_parsed'] = [column.strip() for column in value['columns'].split(',')]
        value['variable_result'] = value['expression'].evaluate(user)
        return super(TableBlock, self).render(value)

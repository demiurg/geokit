import random

from wagtail.wagtailcore.blocks import CharBlock, DateBlock, ListBlock, StructBlock

from expressions.blocks import ExpressionChooserBlock
from expressions.models import FormVariable
from layers.blocks import LayerChooserBlock


# Inherits from StructBlock to reuse form rendering logic.
class GraphBlock(StructBlock):
    start_date = DateBlock()
    end_date = DateBlock()

    class Meta:
        template = 'builder/blocks/graph.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = random.randint(1, 1000)  # Used to give each div a unique id, should be done a better way

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
    form_variable = CharBlock()
    columns = CharBlock()

    class Meta:
        template = 'builder/blocks/table.html'
        icon = 'placeholder'

    def render(self, value, user):
        value['id'] = random.randint(1, 1000)
        value['columns_parsed'] = [column.strip() for column in value['columns'].split(',')]
        value['variable_result'] = FormVariable.objects.get(name=value['form_variable'], user=user).deserialize()
        return super(TableBlock, self).render(value)

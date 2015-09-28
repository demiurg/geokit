import random

from django import forms

from wagtail.wagtailcore.blocks import DateBlock, FieldBlock, StructBlock


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


class FloatBlock(FieldBlock):
    def __init__(self, required=True, help_text=None, **kwargs):
        self.field = forms.FloatField(required=required, help_text=help_text)
        super(FloatBlock, self).__init__(**kwargs)


class BBoxBlock(StructBlock):
    minLon = FloatBlock()
    minLat = FloatBlock()
    maxLon = FloatBlock()
    maxLat = FloatBlock()


class MapBlock(StructBlock):
    bbox = BBoxBlock()

    class Meta:
        template = 'builder/blocks/map.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = random.randint(1, 1000)

        return super(MapBlock, self).render(value)

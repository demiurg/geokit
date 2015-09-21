import random

from wagtail.wagtailcore.blocks import StructBlock


# Inherits from StructBlock to reuse form rendering logic.
class GraphBlock(StructBlock):
    class Meta:
        template = 'builder/blocks/graph.html'
        icon = 'placeholder'

    def render(self, value):
        value["id"] = random.randint(1, 1000)  # Used to give each div a unique id, should be done a better way
        return super(GraphBlock, self).render(value)

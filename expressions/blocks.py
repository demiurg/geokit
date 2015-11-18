from django.utils.functional import cached_property

from wagtail.wagtailcore.blocks import ChooserBlock


class ExpressionChooserBlock(ChooserBlock):
    @cached_property
    def target_model(self):
        from expressions.models import Expression
        return Expression

    @cached_property
    def widget(self):
        pass

    def get_prep_value(self, expression):
        return expression.id

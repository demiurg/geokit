from django.forms import Widget
from django.forms.widgets import Select, SelectMultiple
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe


class ColorWidget(Widget):
    def render(self, name, value, attrs=None):
        if not value:
            value_string = ""
        else:
            value_string = 'value="{value}"'.format(value=value)

        return mark_safe(
            '<input class="color-ramp-picker" style="box-sizing: content-box" type="color" name="{name}" {value_string} />'.format(name=name, value_string=value_string)
        )


class MapSelectWidget(Select):
    '''
    Renders Leaflet map with features from selected layer,
    returns id of selected feature.
    '''
    template_name = 'builder/widgets/map_select_widget.html'

    def __init__(self, layer, attrs=None):
        super(MapSelectWidget, self).__init__(attrs)
        self.layer = layer

    def render(self, name, value, attrs=None, choices=()):
        context = {
            'name': name,
            'choices': self.choices,
            'layer': self.layer,
            'select_multi': False,
        }

        return render_to_string(self.template_name, context)


class MapSelectMultipleWidget(SelectMultiple):
    template_name = 'builder/widgets/map_select_widget.html'

    def __init__(self, layer, attrs=None):
        super(MapSelectMultipleWidget, self).__init__(attrs)
        self.layer = layer

    def render(self, name, value, attrs=None, choices=()):
        context = {
            'name': name,
            'choices': self.choices,
            'layer': self.layer,
            'select_multi': True,
        }

        return render_to_string(self.template_name, context)

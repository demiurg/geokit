from django.forms.widgets import NumberInput
from django.template.loader import render_to_string


class MapSelectWidget(NumberInput):
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
            'layer_name': self.layer.name,
            'bounds': self.layer.bounds
        }
        return render_to_string(self.template_name, context)

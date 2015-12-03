from collections import OrderedDict

from django.forms import ModelChoiceField

from wagtail.wagtailforms.forms import FormBuilder

from builder.widgets import MapSelectWidget
from layers.models import Feature


def create_map_select(self, field, options):
    return ModelChoiceField(
        queryset=Feature.objects.filter(layer=field.layer.name),
        widget=MapSelectWidget(field.layer)
    )


def create_map_multi_select(self, field, options):
        return self.create_dropdown_field(field, options)


class GeoKitFormBuilder(FormBuilder):
    '''
    Subclass of wagtail's FormBuilder that uses the extra field types in
    geokit_field_type instead of wagtails default field_type.
    '''
    def __init__(self, fields):
        super(GeoKitFormBuilder, self).__init__(fields)

        self.FIELD_TYPES['map_select'] = create_map_select
        self.FIELD_TYPES['map_multi_select'] = create_map_multi_select

    @property
    def formfields(self):
        formfields = OrderedDict()

        for field in self.fields:
            options = self.get_field_options(field)

            if field.geokit_field_type in self.FIELD_TYPES:
                formfields[field.clean_name] = self.FIELD_TYPES[field.geokit_field_type](self, field, options)
            else:
                raise Exception("Unrecognized field type: " + field.geokit_field_type)

        return formfields

    def get_field_options(self, field):
        options = super(GeoKitFormBuilder, self).get_field_options(field)
        if field.layer:
            options['layer'] = field.layer

        return options

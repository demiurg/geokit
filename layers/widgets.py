import json

from django.template.loader import render_to_string

from wagtail.wagtailadmin.widgets import AdminChooser

from layers.models import Layer


class AdminLayerChooser(AdminChooser):
    choose_one_text = 'Choose a layer'
    choose_another_text = 'Choose another layer'
    link_to_chosen_text = 'Edit this layer'

    def render_html(self, name, value, attrs):
        instance, value = self.get_instance_and_id(Layer, value)
        original_field_html = super(AdminLayerChooser, self).render_html(name, value, attrs)

        return render_to_string("layers/chooser.html", {
            'widget': self,
            'original_field_html': original_field_html,
            'attrs': attrs,
            'value': value,
            'layer': instance
        })

    def render_js(self, id_, name, value):
        return "createLayerChooser({0})".format(json.dumps(id_))

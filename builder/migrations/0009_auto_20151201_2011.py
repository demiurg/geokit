# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


# Since we can't override model field names, we need to create a new
# field for FormVariableField that has extra field types. This tranfers
# each variable field's type to the newly created field.
def transfer_field_type(apps, schema_editor):
    FormVariableField = apps.get_model('builder', 'FormVariableField')

    for form_variable in FormVariableField.objects.all():
        form_variable.geokit_field_type = form_variable.field_type
        form_variable.save()


class Migration(migrations.Migration):

    dependencies = [
        ('builder', '0008_auto_20151201_2010'),
    ]

    operations = [
        migrations.RunPython(transfer_field_type),
    ]

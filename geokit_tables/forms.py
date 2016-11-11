import csv

from django import forms

from geokit_tables.models import GeoKitTable


class GeoKitTableForm(forms.ModelForm):
    """Lets uesrs specify a new GeoKitTable, including its Records.

    In addition to uploading a CSV file, the user also specifies which column
    in the file is the daterange field.
    """
    csv_file = forms.FileField(required=True)

    class Meta:
        model = GeoKitTable
        fields = ['name', 'description']


class GeoKitTableEditForm(forms.ModelForm):
    """Permits users to edit the name or description of the table.

    Does not, however, permit editing of the uploaded Records.
    """
    class Meta:
        model = GeoKitTable
        fields = ['name', 'description']

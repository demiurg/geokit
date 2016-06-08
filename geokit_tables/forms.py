import csv

from django import forms

from geokit_tables.models import GeoKitTable


class GeoKitTableForm(forms.ModelForm):
    """Lets uesrs specify a new GeoKitTable, including its Records.

    In addition to uploading a CSV file, the user also specifies which column
    in the file is the daterange field.
    """
    csv_file = forms.FileField(required=True)
    date_column = forms.CharField(required=True, help_text=(
            "Specify the column that contains the date range in "
            "ISO 8601 format (<start>/<end>)."))

    def clean(self):
        cleaned_data = super(GeoKitTableForm, self).clean()
        csv_file = self.files.get("csv_file")
        date_column = cleaned_data.get("date_column")

        if csv_file and date_column:
            reader = csv.DictReader(csv_file)
            if date_column not in reader.fieldnames:
                raise forms.ValidationError(
                        "Date column must be a valid column in the csv file.")

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

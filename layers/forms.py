from django import forms
from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat

from .models import Layer

import tempfile
import zipfile
import fiona
import os


MAX_FILE_SIZE = 1000 * 1000 * 100 # ~ 100MB


def zip_collection(filepath):
    filepath = filepath

    zf = zipfile.ZipFile(filepath)

    extensions = {}
    for info in zf.infolist():
        if '/' not in info.filename:
            basename, extension = os.path.splitext(info.filename)
            extensions[extension] = info.filename

    # if there is shp in the archive, assume other files have same base
    if '.shp' in extensions:
        open_file = extensions['.shp']
    elif '.SHP' in extensions:
        open_file = extensions['.SHP']
    # else try to open first file
    else:
        open_file = extensions.values[0]
        # TODO: add ability to open multiple file/collections

    collection = fiona.open(
        "/" + open_file,
        vfs="zip://" + filepath
    )

    return collection


class LayerForm(forms.ModelForm):
    vector_file = forms.FileField(
        required=True, help_text=(
            "Upload a Zip archive containing .shp, .dbf and .prj files or "
            " other OGR compatible vector format file, such as geojson."
        )
    )

    def clean_vector_file(self):
        lfile = self.cleaned_data['vector_file']

        if lfile.size > MAX_FILE_SIZE:
            error = (
                u"Please simplify the geometres and try uploading again."
                " File should not be bigger than {}."
            )
            raise ValidationError(error.format(filesizeformat(MAX_FILE_SIZE)))

        tmp = tempfile.NamedTemporaryFile(mode='wb', suffix=lfile.name)
        destination = open(tmp.name, 'wb+')
        for chunk in lfile.chunks():
            destination.write(chunk)
        destination.close()
        with fiona.drivers():
            try:
                if lfile.name[-3:].lower()  == 'zip':
                    if not zipfile.is_zipfile(tmp.name):
                        raise ValidationError("Not a valid Zip Archive")

                    self._collection = zip_collection(tmp.name)
                else:
                    self._collection = fiona.open(tmp.name, 'r')

                # When this function is over, the crs of the collection can't be
                # accessed unless it is done so here first.
                self._crs = self._collection.crs

            except Exception as e:
                print e
                er = str(e)
                er = er.replace(tmp.name.replace(lfile.name, ''), '')
                raise ValidationError(
                    "Error extracting vector data from the file. " + er
                )

    def get_collection(self):
        try:
            return self._collection
        except AttributeError:
            return []

    # Use this instead of trying to get the crs of the collection
    def layer_crs(self):
        try:
            return self._crs
        except AttributeError:
            return None

    class Meta:
        model = Layer
        fields = ['name', 'description']


class LayerEditForm(forms.ModelForm):
    class Meta:
        model = Layer
        fields = ['name', 'description']

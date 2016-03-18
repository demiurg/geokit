import csv

from django.shortcuts import render

from geokit_tables.forms import GeoKitTableForm
from geokit_tables.models import GeoKitTable


def index(request):
    tables = GeoKitTable.objects.all()
    return render(request, 'geokit_tables/index.html', {'tables': tables})


def add(request):
    if request.method == 'POST':
        form = GeoKitTableForm(request.POST, request.FILES)

        if form.is_valid():
            #t = form.save()

            reader = csv.DictReader(form.cleaned_data['csv_file'])
            print reader.fieldnames
    else:
        form = GeoKitTableForm()

    return render(request, 'geokit_tables/add.html', {'form': form})

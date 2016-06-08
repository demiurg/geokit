import csv
from datetime import datetime

from django.db import transaction
from django.shortcuts import get_object_or_404, render, redirect

from rest_framework import viewsets
from wagtail.wagtailadmin import messages

from psycopg2.extras import DateRange

from .forms import GeoKitTableForm, GeoKitTableEditForm
from .models import GeoKitTable, Record
from .serializers import GeoKitTableSerializer


class GeoKitTableViewSet(viewsets.ModelViewSet):
    queryset = GeoKitTable.objects.all()
    serializer_class = GeoKitTableSerializer


def index(request):
    tables = GeoKitTable.objects.all()
    return render(request, 'geokit_tables/index.html', {'tables': tables})


def add(request):
    if request.method == 'POST':
        form = GeoKitTableForm(request.POST, request.FILES)

        if form.is_valid():
            with transaction.atomic():  # Don't want to save an incomplete table
                t = form.save()

                reader = csv.DictReader(form.cleaned_data['csv_file'])
                date_column = form.cleaned_data['date_column']

                for row in reader:
                    date_strings = row[date_column].split('/')
                    date_format = "%Y-%j"
                    if len(date_strings) == 2:
                        date_range = DateRange(
                            lower=datetime.strptime(date_strings[0], date_format).date(),
                            upper=datetime.strptime(date_strings[1], date_format).date()
                        )
                    elif len(date_strings) == 1:
                        date = datetime.strptime(date_strings[0], date_format).date()
                        date_range = DateRange(lower=date, upper=date, bounds='[]')
                    else:
                        ve_str = ("{} must provide a ISO 8601 date string or "
                                  "range seperated by a /.")
                        raise ValueError(ve_str.format(date_column))

                    r = Record(table=t, properties=row, date=date_range)
                    r.save()

            messages.success(request, "Table '{0}' added.".format(t.name))
            return redirect('geokit_tables:index')
    else:
        form = GeoKitTableForm()

    return render(request, 'geokit_tables/add.html', {'form': form})


def edit(request, table_name):
    table = get_object_or_404(GeoKitTable, pk=table_name)

    if request.POST:
        form = GeoKitTableEditForm(request.POST, instance=table)

        if form.is_valid():
            table = form.save()

            messages.success(request, "The table '{0}' was saved.".format(table.name))
            return redirect('geokit_tables:index')
        else:
            messages.error(request, "The table could not be saved due to errors.")
    else:
        form = GeoKitTableEditForm(instance=table)

    return render(request, "geokit_tables/edit.html", {
        'table': table,
        'form': form
    })


def delete(request, table_name):
    table = get_object_or_404(GeoKitTable, pk=table_name)
    table.delete()

    messages.success(request, "Table '{0}' deleted".format(table_name))

    return redirect('geokit_tables:index')

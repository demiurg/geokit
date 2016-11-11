import csv
import datetime
import six
import re

from django.db import transaction
from django.shortcuts import get_object_or_404, render, redirect

from rest_framework import viewsets
from wagtail.wagtailadmin import messages

from psycopg2.extras import DateRange

from .forms import GeoKitTableForm, GeoKitTableEditForm
from .models import GeoKitTable, Record
from .serializers import GeoKitTableSerializer

from csvkit import table as csvtable

NoneType = type(None)


class GeoKitTableViewSet(viewsets.ModelViewSet):
    queryset = GeoKitTable.objects.all()
    serializer_class = GeoKitTableSerializer


def index(request):
    tables = GeoKitTable.objects.all()
    return render(request, 'geokit_tables/index.html', {'tables': tables})


def get_schema(table):
    column_types = {
        bool: 'int',
        int: 'int',
        float: 'float',
        datetime.datetime: 'datetime',
        datetime.date: 'date',
        datetime.time: 'time',
        NoneType: 'str',
        six.text_type: 'str'
    }

    schema = {}

    for column in table:
        schema[column.name] = column_types[column.type]

    return schema


def get_data(table):
    headers = table.headers()
    rows = table.to_rows()
    return map(lambda row: {k: v for k, v in zip(headers, row)}, rows)


def get_daterange(schema, row):
    columns = [
        k for k, v in schema.items() if v.startswith('date')
    ]
    keys = schema.keys()

    date_range = None
    if len(columns) == 2:
        lower, upper = sorted(
            [row[columns[0]], row[columns[1]]]
        )
        date_range = DateRange(lower=lower, upper=upper)
    elif len(columns) == 1:
        # date = datetime.strptime(strings[0], format).date()
        date_range = DateRange(
            lower=row[columns[0]],
            upper=row[columns[0]],
            bounds='[]'
        )
    elif len(columns) == 0:
        if 'date' in keys:
            try:
                date = datetime.datetime.strptime(row['date'], "%Y-%j")
                date_range = DateRange(
                    lower=date.date(), upper=date.date(), bounds='[]'
                )
            except Exception as e:
                print "Exception, not julian", e
                pass
        elif 'year' in keys:
            try:
                l = datetime.datetime.strptime(str(row['year']), "%Y")
                u = datetime.datetime.strptime(str(int(row['year']) + 1), "%Y")
                date_range = DateRange(
                    lower=l.date(), upper=u.date(), bounds='[)'
                )
            except Exception as e:
                print "Exception, not year", e, row['date']
                pass

    return date_range


def add(request):
    if request.method == 'POST':
        form = GeoKitTableForm(request.POST, request.FILES)

        if form.is_valid():
            with transaction.atomic():  # Don't want to save an incomplete table
                t = form.save(commit=False)

                csv_table = csvtable.Table.from_csv(
                    form.cleaned_data['csv_file'],
                    name=t.name,
                )

                t.schema = get_schema(csv_table)
                t.field_names = csv_table.headers()
                t.save()

                records = []
                for row in get_data(csv_table):
                    date_range = get_daterange(t.schema, row)
                    records.append(Record(
                        table=t, properties=row, date_range=date_range
                    ))

                Record.objects.bulk_create(records)

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

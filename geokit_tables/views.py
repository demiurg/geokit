import datetime
import os
import six

from django.conf import settings
from django.db import connection, transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render, redirect

import django_rq
from rest_framework import viewsets
import django_filters
from wagtail.wagtailadmin import messages

from psycopg2.extras import DateRange

from .forms import GeoKitTableForm, GeoKitTableEditForm
from .models import GeoKitTable, Record
from .serializers import GeoKitTableSerializer

from variables.models import Variable

from csvkit import table as csvtable

NoneType = type(None)


class GeoKitTableViewSet(viewsets.ModelViewSet):
    queryset = GeoKitTable.objects.all()
    serializer_class = GeoKitTableSerializer
    filter_backends = (django_filters.rest_framework.DjangoFilterBackend,)
    filter_fields = ('id', 'name', 'status',)


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


def get_daterange_partial(schema, row):
    columns = [
        k for k, v in schema.items() if v.startswith('date')
    ]
    keys = schema.keys()

    def date_range(row):

        return None

    if len(columns) == 2:
        if row[columns[0]] <= row[columns[1]]:
            lower, upper = columns[0], columns[1]
        else:
            lower, upper = columns[1], columns[0]

        def date_range(in_row):
            return DateRange(lower=in_row[lower], upper=in_row[upper])

    elif len(columns) == 1:
        # date = datetime.strptime(strings[0], format).date()
        def date_range(in_row):
            return DateRange(
                lower=in_row[columns[0]],
                upper=in_row[columns[0]],
                bounds='[]'
            )
    elif len(columns) == 0:
        if 'date' in keys:
            try:
                datetime.datetime.strptime(row['date'], "%Y-%j")
            except Exception as e:
                print "Exception, not julian", e
            else:
                def date_range(in_row):
                    d = datetime.datetime.strptime(in_row['date'], "%Y-%j")
                    return DateRange(
                        lower=d.date(), upper=d.date(), bounds='[]'
                    )
        elif 'year' in keys:
            try:
                datetime.datetime.strptime(
                    str(int(row['year']) + 1), "%Y"
                )
            except Exception as e:
                print "Exception, not year", e, row['year']
            else:
                def date_range(in_row):
                    l = datetime.datetime.strptime(
                        str(in_row['year']), "%Y"
                    )
                    u = datetime.datetime.strptime(
                        str(int(in_row['year']) + 1), "%Y"
                    )
                    return DateRange(
                        lower=l.date(), upper=u.date(), bounds='[)'
                    )

    return date_range


def populate_table(tenant, table_id):
    '''
    To be run in rq worker.

    Note: Since this is not called in a request/response context,
    the schema needs to be set manually.
    '''

    # This is a bit of a hack that is needed when forking processes
    # with a database connection. See: https://github.com/ui/django-rq/issues/123
    connection.close()

    connection.set_schema(tenant)

    table = GeoKitTable.objects.get(pk=table_id)
    csv_path = "%s/uploads/csv/%s/%s.csv" % (settings.MEDIA_ROOT, tenant, table_id)

    try:
        with open(csv_path, 'r') as csv_file:
            with transaction.atomic():
                csv_table = csvtable.Table.from_csv(
                    csv_file,
                    name=table.name,
                )

                table.schema = get_schema(csv_table)
                table.field_names = csv_table.headers()
                table.status = 0  # Good
                table.save()

                csv_data = get_data(csv_table)
                get_daterange = get_daterange_partial(table.schema, csv_data[0])
                records = []
                for row in csv_data:
                    date_range = get_daterange(row)
                    records.append(Record(
                        table=table, properties=row, date_range=date_range
                    ))

                Record.objects.bulk_create(records)
    finally:
        os.remove(csv_path)


def populate_table_handler(tenant, table_id):
    connection.close()
    connection.set_schema(tenant)

    table = GeoKitTable.objects.get(pk=table_id)
    table.status = 2  # Bad
    table.save()


def add(request):
    if request.method == 'POST':
        form = GeoKitTableForm(request.POST, request.FILES)

        if form.is_valid():
            t = form.save()

            csv_path = "%s/uploads/csv/%s/%s.csv" % (settings.MEDIA_ROOT, request.tenant.schema_name, t.pk)
            if not os.path.exists(os.path.dirname(csv_path)):
                os.makedirs(os.path.dirname(csv_path))
            with open(csv_path, 'w') as csv_out:
                for chunk in form.cleaned_data['csv_file'].chunks():
                    csv_out.write(chunk)

            django_rq.enqueue(populate_table, request.tenant.schema_name, t.pk)

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


def generate_download(request, table_id):
    table = get_object_or_404(GeoKitTable, pk=table_id)

    django_rq.enqueue(table.export_to_file, request.tenant.schema_name)
    return JsonResponse({})


def delete(request, table_name):
    table = get_object_or_404(GeoKitTable, pk=table_name)

    variables_to_delete = []
    pages_to_delete = set()

    for v in Variable.objects.all():
        if table.pk in v.root.get_tables():
            variables_to_delete.append(v)

    for v in variables_to_delete:
        for page in v.get_pages():
            pages_to_delete.add(page)

    if request.method == 'POST':
        with transaction.atomic():
            for v in variables_to_delete:
                v.delete()

            for p in pages_to_delete:
                p.delete()

            table.delete()

        message = "Table {0} deleted.".format(table_name)
        if variables_to_delete:
            message = message + " Variables {0} deleted.".format(', '.join([v.name for v in variables_to_delete]))
        if pages_to_delete:
            message = message + " Pages {0} deleted.".format(', '.join([p.title for p in pages_to_delete]))
        messages.success(request, message)

        return redirect('geokit_tables:index')

    return render(request, 'geokit_tables/confirm_delete.html', {
        'table': table,
        'variables_to_delete': variables_to_delete,
        'pages_to_delete': pages_to_delete,
    })

import csv
from datetime import datetime

from django.db import transaction
from django.shortcuts import render, redirect

from psycopg2.extras import DateRange

from geokit_tables.forms import GeoKitTableForm
from geokit_tables.models import GeoKitTable, Record


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
                        date_range = DateRange(lower=date, upper=date)
                    else:
                        raise ValueError("%s must provide a ISO 8601 date string or range seperated by a /." % date_column)

                    r = Record(table=t, properties=row, date=date_range)
                    r.save()

            return redirect('geokit_tables:index')
    else:
        form = GeoKitTableForm()

    return render(request, 'geokit_tables/add.html', {'form': form})

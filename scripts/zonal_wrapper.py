#!/usr/bin/env python
import argparse
import sys
import os
# Setup django
proj_path = "/home/remery/Projects/geokit"
sys.path.append(proj_path)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geokit.settings.dev")
os.chdir(proj_path)
import django
django.setup()
from variables.models import Result
from geokit import settings
#TODO: Actually import gips
print settings.GIPS_PATH
print settings.GIPSBIN_PATH
sys.path.append(settings.GIPS_PATH)
sys.path.append(settings.GIPSBIN_PATH)
import gips
from zonalsummary import ZonalSummary
from tenant_schemas.utils import schema_context

G_SITE = ''


def make_result(result):
    key = result[0]
    bands = result[1]

    date = key[0]
    product = key[1]
    fid = int(key[2])

    for band in bands.keys():
        stats = bands[band]

        minimum = float(stats[0]) if stats[0] != 'nan' else None
        maximum = float(stats[1]) if stats[1] != 'nan' else None
        mean = float(stats[2]) if stats[2] != 'nan' else None
        sd = float(stats[3]) if stats[3] != 'nan' else None
        skew = float(stats[4]) if stats[4] != 'nan' else None
        count = float(stats[5]) if stats[5] != 'nan' else None

        with schema_context(G_SITE):
            r = Result(
                date=date,
                band=band,
                fid=fid,
                product=product,
                minimum=minimum,
                maximum=maximum,
                mean=mean,
                sd=sd,
                skew=skew,
                count=count
            )
            r.save()

def main():
    return
    path = os.path.dirname(os.path.abspath(__file__))
    desc = '''A wrapper for the ZonalSummary tool which creates Result objects
    from the output.'''
    parser = argparse.ArgumentParser(description=desc)
    parser.add_argument(
        '-s',
        '--site',
        required=True,
        help='GeoKit site requesting data'
    )
    parser.add_argument(
        '-d',
        '--projdir',
        required=True,
        help='Gips inventory directory',
        default=path

    )
    init_args = parser.parse_args()

    G_SITE = init_args.site

    a = ZonalSummary(projdir=init_args.projdir)

    args = {
        'stats': ['min', 'max', 'mean', 'sd', 'skew', 'count'],
        'shapefile': init_args.vector,
        'outdir': None,
        'rasterpaths': None,
        'bands': [],
        'percentiles': [],
        'filter': None,
        'passthrough': False,
        'products': [],
        'nodata': None,
        'raster_dates': [],
        #TODO: Make this configurable
        'processes': 1,
        'outfile': None,
        'alltouch': False,
        'continue': False

    }

    results = a.run(**args)
    for r in results:
        make_result(r)
        return

if __name__ == "__main__":
    main()

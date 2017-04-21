#!/usr/bin/env python

import sys
import os
import datetime
import time # if only
import logging

import django
from django.core import mail

# set constants
product_name = 'modis_fsnow_fractional-snow-cover'
check_count, wait_time_between_checks = 10, 60 # one check per minute for ten minutes

def failure(message):
    logging.getLogger(__name__).error(message)
    mail.mail_admins(subject='Problem in daily geokit-datahandler joint exercise',
                     message=message, fail_silently=False)

def main(gips_shp_path):
    """Start a pre-defined DH run, then watch for a result until a timeout.

    Takes as an argument the gips-side full path to the shapefile."""
    from variables.data import rpc_con

    logger = logging.getLogger(__name__)

    four_years_ago = datetime.datetime.now() - datetime.timedelta(years=4)

    job_id = rpc_con().submit_job('test', product_name,
            {'site': gips_shp_path, 'key': 'shaid'}, {'dates': 4_years_ago.strftime('%Y-%j')})

    logger.info('Job submitted; ID {}'.format(job_id))

    # check periodically for a result
    for _ in range(check_count):
        time.sleep(wait_time_between_checks)
        results = rpc_con().stats_request_results({'job': job_id})
        if results:
            log.info('Successful datahandler run: {}'.format(results))
            return

    failure('time out with no outcome, last results were {}'.format(results))


if __name__ == "__main__":
    # can't do relative imports in non-package so have to hack sys.path instead:
    # "Add the directory two levels up from this file to sys.path."
    sys.path.append(os.path.normpath(os.path.dirname(os.path.abspath(__file__)) + '/../..'))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geokit.settings")
    django.setup()

    if len(sys.argv) != 2:
        failure('Wrong number of arguments;'
                ' expected absolute path to shapefile for spatial extent.')

    try:
        main(sys.argv[1])
    except Exception as e:
        failure('Exception during test: {}'.format(e))
        raise

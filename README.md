# GeoKit

## Configuration

Put this in `local.py` for local dev & testing purposes:

```
from .base import DATABASES

your_db_name = # set your db name here

DATABASES['default']['TEST'] = {'NAME': your_db_name }

DEBUG = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': { 'class': 'logging.StreamHandler', },
    },
    'loggers': {
        'tests': {
            'level': 'INFO',
            'handlers': ['console'],
        },
    },
}
```

## Installation and running

The `run.sh` script takes either the `hostname:port` or just `port` as an argument:

```
#!bash

./run.sh 0.0.0.0:8000
```
or
```
#!bash

./run.sh 8000
```

Run the test suite with:

```
#!bash

# first make sure this is running in its own terminal or in the background:
ssh -o "ExitOnForwardFailure yes" -nNT -L 5432:localhost:5432 oka.ags.io

# to run all tests:
./manage.py test --keepdb # <-- Test DB creation requires circa 30 sec,
                          #     so save your DB between runs with --keepdb
# specific subsets of tests:
./manage.py test --keepdb expressions
./manage.py test --keepdb expressions.tests.test_functions
```


Before geokit is started, one needs to create a virtualenvironment and run `pip
install -r requirements.txt` inside of it. In addition, the node dependencies
must be installed by changing to the `vector_tiles` directory and running `npm
install`.

The `run.sh` script also creates an SSH tunnel to oka's Postgres port, so
geokit can be run on any system that can ssh to oka.ags.io

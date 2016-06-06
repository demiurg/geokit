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

Before geokit is started, one needs to create a virtualenvironment and run `pip
install -r requirements.txt` inside of it. In addition, the node dependencies
must be installed by changing to the `vector_tiles` directory and running `npm
install`.

The `run.sh` script also creates an SSH tunnel to oka's Postgres port, so
geokit can be run on any system that can ssh to oka.ags.io

# GeoKit

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

Before geokit is started, one needs to create a virtualenvironment and run `pip install -r requirements.txt` inside of it. In addition, the node dependencies must be installed by changing to the `vector_tiles` directory and running `npm install`.

The `run.sh` script also creates an SSH tunnel to oka's Postgres port, so geokit can be run on any system that can ssh to oka.ags.io
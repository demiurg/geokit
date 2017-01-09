#!/bin/bash

if [[ $1 =~ ^.*help.*$ ]]; then
    echo "runserver port and host are optional parameters"
    echo "ex ./run.sh localhost:8100"
    exit
fi

if [ "$#" -ne 1 ]; then
    export PORT="8000"
    export HOSTNAME="localhost"
fi

if [[ $1 =~ ^([0-9]+)$ ]]; then
    export PORT=${BASH_REMATCH[1]}
    export HOSTNAME="localhost"
fi

if [[ $1 =~ ^(.+):([0-9]+)$ ]]; then
    export HOSTNAME=${BASH_REMATCH[1]}
    export PORT=${BASH_REMATCH[2]}
fi

#Bump node port by one from runserver port
let NODEPORT=$(expr $PORT + 1)

node ./vector_tiles/server.js $NODEPORT &
ssh -o "ExitOnForwardFailure yes" -L 5432:localhost:5432 -f oka -N &
python ./manage.py runserver 0.0.0.0:$PORT

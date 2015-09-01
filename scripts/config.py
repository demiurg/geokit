#!/usr/bin/env python

import json

assetpath = 'assets.json'
variablepath = 'variables.json'
locationpath = 'locations.json'
dictionarypath = 'dictionary.json'

assets = json.loads(open(assetpath).read())
variables = json.loads(open(variablepath).read())
locations = json.loads(open(locationpath).read())
dictionary = json.loads(open(dictionarypath).read())

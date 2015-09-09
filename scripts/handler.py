#!/usr/bin/env python

import datetime
from collections import defaultdict
import numpy as np
from gipsproject import GIPSproject
import config

from pdb import set_trace


class Datacube(object):

    def __init__(self, variables, locationnames, dates):
        self.variables = variables
        self.locationnames = locationnames
        self.dates = dates
        self.nvariables = len(variables)
        self.nlocations = len(locationnames)
        self.ntimes = len(dates)
        self.data = np.zeros((self.nvariables, self.nlocations, self.ntimes))
        self.mask = np.zeros_like(self.data, dtype=int)

    def insert(self, variable, locationname, date, value):
        ivar = self.variables.index(variable)
        iloc = self.locationnames.index(locationname)
        idate = self.dates.index(date)
        self.data[ivar, iloc, idate] = value
        self.mask[ivar, iloc, idate] = 1


def run_gips_project(variables, locations, times):
    """ Translate Geokit inputs into GIPS inputs and run GIPS """
    print "variables", variables
    print "locations", locations
    print "times", times

    daterange = times[0]

    dates = str(daterange)
    key = str(config.locations[locations[0]]['key'])
    site = str(config.locations[locations[0]]['path'])
    where = str(locations[1])

    commandparams = defaultdict(dict)
    productinfo = defaultdict(list)

    for variable in variables:
        asset = str(config.variables[variable]['asset'])
        product = str(config.variables[variable]['product_name'])
        layer = config.variables[variable]['layer']
        productinfo[asset].append((variable, product, layer))
        if config.assets[asset]['resolution_units'] == "m":
            res = config.assets[asset]['resolution']
        else:
            res = config.assets[asset]['approx_resolution_meters']
        commandparams[asset]['res'] = res
        try:
            commandparams[asset]['products'].add(product)
        except:
            commandparams[asset]['products'] = set([product])

    inventories = dict()
    for asset in commandparams.keys():
        products = list(commandparams[asset]['products'])
        res = commandparams[asset]['res']
        print asset, products, dates, key, site, where, res
        project = GIPSproject()
        project.set(asset, products, dates, key, site, where, res)
        inventory = project.run()
        print "inventory"
        print inventory
        if len(inventory) > 0:
            inventories[asset] = (inventory, commandparams[asset], productinfo[asset])

    return inventories
   

def aggregate(inventories, datacube):
    # Each inventory is associated with a single location and GIPS project tree
    # the project tree has one or more products. Each product provides data 
    # for one or more variables.

    for asset, item in inventories.items():
        inventories, params, info = item
        for varset in info:
            variable, product, layer = varset
            for inventory in inventories:
                try:
                    location = inventory.get_location()
                except Exception:
                    set_trace()
                dates = inventory.dates
                for date in dates:
                    img = inventory.data[date].open(product, None, False)
                    if layer is not None:
                        band = img[str(layer)]
                    else:
                        band = img[0]
                    missingval = band.NoDataValue()
                    data = band.Read()
                    try:
                        mean = data[data != missingval].mean()
                    except Exception:
                        pass
                    else:
                        print variable, location, date, mean
                        datacube.insert(variable, location, date, mean)

    return datacube


def handle(variables, locations, times):

    # use GIPS to create image output
    inventories = run_gips_project(variables, locations, times)

    # times convert to dates
    daterange = times[0].split(',')
    startdate = datetime.datetime.strptime(daterange[0], '%Y-%j').date()
    try:
        enddate = datetime.datetime.strptime(daterange[1], '%Y-%j').date()
    except:
        enddate = startdate
    ndates = (enddate - startdate).days
    dates = [startdate + datetime.timedelta(i) for i in range(ndates+1)]

    nvariables = len(variables)

    # for the first inventory key, how many GIPS inventories are there

    gipsinventories = inventories.values()[0][0]
    locationnames = [i.get_location() for i in gipsinventories]
    nlocations = len(locationnames)
    # nlocations = len(inventories.values()[0][0])

    datacube = Datacube(variables, locationnames, dates)

    # collect results into datacube
    if len(inventories) > 0:
        datacube = aggregate(inventories, datacube)
    else:
        return None

    set_trace()





def example1():

    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)

    # variable set
    variables = "tmax_conus, ndvi_large"
    variables = [v.strip() for v in variables.split(',')]

    # time set
    daterange = "2014-193,2014-194"
    interval = "1-day"
    times = (daterange, interval)

    result = handle(variables, locations, times)
    print result


# def example2():
#     # location set
#     source = "LargeLakesUS"
#     query = "uuid=4b14eba8-b36b-4170-81b6-6924c3f4b9d3"
#     locations = (source, query)
#     # variable set
#     variables = "tmin_conus,tmax_conus,lswi_large"
#     # time set
#     daterange = "2015-201"
#     interval = "1-day"
#     times = (daterange, interval)
#     # create images
#     inventories = run_gips_project(variables, locations, times)


if __name__ == "__main__":
    example1()



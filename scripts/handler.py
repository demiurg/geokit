#!/usr/bin/env python

import datetime
from collections import defaultdict
from gipsproject import GIPSproject
import config

from pdb import set_trace


def run_gips_project(variables, locations, times):
    """ Translate Geokit inputs into GIPS inputs and run GIPS """
    print "variables", variables
    print "locations", locations
    print "times", times
    # collect by unique asset name and loop over assets
    # because asset determines the command that will be used
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
   

def aggregate(inventories):

    # Each inventory is associated with a single GIPS project tree
    # the project tree has one or more products. Each product provides data 
    # for one or more variables


    for asset, item in inventories.items():

        inventories, params, info = item
    
        # print asset, inventories, params, info

        # img = inv.data[inv.dates[0]].open(asset, None, False)

        products = params['products']

        for varset in info:

            variable, product, layer = varset

            for inventory in inventories:
                # each inventory is associated with a location

                location = inventory.get_location()

                dates = inventory.dates

                for date in dates:

                    # print date

                    img = inventory.data[date].open(product, None, False)

                    if layer is not None:
                        band = img[str(layer)]
                    else:
                        band = img[0]

                    missingval = band.NoDataValue()
                    data = band.Read()

                    try:
                        mean = data[data != missingval].mean()
                    except:
                        mean = -9999.
                    print variable, location, date, mean

                    # set_trace()


def example1():
    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)
    # variable set
    # variables = "ndvi_large, satvi_large, tsurf_large, tmax_conus, tmin_conus"
    # variables = "ndvi_large, satvi_large, prcp_global"
    # variables = "ndvi_large"
    variables = "tave_global"

    variables = variables.split(',')
    variables = [v.strip() for v in variables]
    # time set
    daterange = "2015-193,2015-194"
    interval = "1-day"
    times = (daterange, interval)
    # create images


    inventories = run_gips_project(variables, locations, times)


    if len(inventories) > 0:
        aggregate(inventories)
    else:
        print "there are no inventories"



def example2():
    # location set
    source = "LargeLakesUS"
    query = "uuid=4b14eba8-b36b-4170-81b6-6924c3f4b9d3"
    locations = (source, query)
    # variable set
    variables = "tmin_conus,tmax_conus,lswi_large"
    variables = variables.split(',')
    variables = [v.strip() for v in variables]
    # time set
    daterange = "2015-201"
    interval = "1-day"
    times = (daterange, interval)
    # create images
    inventories = run_gips_project(variables, locations, times)


if __name__ == "__main__":
    example1()



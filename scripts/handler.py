#!/usr/bin/env python

import datetime

from collections import defaultdict

from gipsproject import GIPSproject
import config


from pdb import set_trace



def run_gips_project(variables, locations, times):
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
    for variable in variables:
        asset = str(config.variables[variable]['asset'])
        product = str(config.variables[variable]['product_name'])
        res = config.assets[asset]['resolution']
        commandparams[asset]['res'] = res
        try:
            commandparams[asset]['products'].append(product)
        except:
            commandparams[asset]['products'] = [product]
    inventories = dict()
    for asset in commandparams.keys():
        products = commandparams[asset]['products']
        res = commandparams[asset]['res']
        print asset, products, dates, key, site, where, res
        project = GIPSproject()
        project.set(asset, products, dates, key, site, where, res)
        inventory = project.run()
        inventories[asset] = project.run()
    return inventories
   

# def spatial_aggregation():


# def temporal_aggregation():



def example1():
    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)
    # variable set
    variables = "ndvi_large,lswi_large"
    variables = variables.split(',')
    variables = [v.strip() for v in variables]
    # time set
    daterange = "2015-201"
    interval = "1-day"
    times = (daterange, interval)
    # create images
    run_gips_project(variables, locations, times)


def example2():
    # location set
    source = "LargeLakesUS"
    query = "uuid=4b14eba8-b36b-4170-81b6-6924c3f4b9d3"
    locations = (source, query)
    # variable set
    variables = "tmin_conus,tmax_conus"
    variables = variables.split(',')
    variables = [v.strip() for v in variables]
    # time set
    daterange = "2015-201"
    interval = "1-day"
    times = (daterange, interval)
    # create images
    run_gips_project(variables, locations, times)


if __name__ == "__main__":
    example1()



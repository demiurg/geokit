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


def main():

    # variable set
    # variables = "ndvi_large,lswi_large"
    # variables = "tmin_conus"
    variables = "tave_global"
    # variables = "ndvi_large, tmax_conus"
    # variables = "ndvi_large"


    # location set
    source = "GADM2"
    # query = "uuid=4b14eba8-b36b-4170-81b6-6924c3f4b9d3"
    # query = "uuid=e14610af-4577-4681-b2ea-e29b0a887a2c"
    #query = "283dfff2-018a-49fa-8a34-09a62f29b8fb"
    query = "HASC_1='US.NH'"
    # time set
    daterange = "2015-201"
    interval = "1-day"


    # location set
    locations = (source, query)
    # variable set
    variables = variables.split(',')
    variables = [v.strip() for v in variables]
    # time set
    times = (daterange, interval)

    # dates = daterange.split(',')
    # startdate = datetime.datetime.strptime(dates[0], '%Y-%m-%d')
    # if len(dates) == 2:
    #     enddate = datetime.datetime.strptime(dates[1], '%Y-%m-%d')
    # else:
    #     enddate = startdate
    # interval = datetime.timedelta(int(interval))
    # times = (startdate, enddate, interval)



    run_gips_project(variables, locations, times)


if __name__ == "__main__":
    main()


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

    def dump(self, filepath):
        self.data.tofile(filepath, sep=',')


class Datarequest(object):

    def __init__(self, variables, locations, times):
        self.locations = locations
        self.variables = variables
        self.times = times
        self.inventories = None
        self.datacube = None

    def run_gips_project(self):
        dates = str(self.times[0])
        key = str(config.locations[self.locations[0]]['key'])
        site = str(config.locations[self.locations[0]]['path'])
        where = str(self.locations[1])
        commandparams = defaultdict(dict)
        productinfo = defaultdict(list)
        for variable in self.variables:
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

        self.inventories = dict()
        for asset in commandparams.keys():
            products = list(commandparams[asset]['products'])
            res = commandparams[asset]['res']
            print asset, products, dates, key, site, where, res
            project = GIPSproject()
            project.set(asset, products, dates, key, site, where, res)
            inventory = project.run()
            if len(inventory) > 0:
                self.inventories[asset] = (inventory, commandparams[asset], productinfo[asset])

    def aggregate(self):
        # Each inventory is associated with a single location and GIPS project tree
        # the project tree has one or more products. Each product provides data 
        # for one or more variables.
        for asset, item in self.inventories.items():
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
                            self.datacube.insert(variable, location, date, mean)

    def handle(self):
        # use GIPS to create image output; create self.inventories
        self.run_gips_project()
        # times convert to dates
        daterange = self.times[0].split(',')
        startdate = datetime.datetime.strptime(daterange[0], '%Y-%j').date()
        try:
            enddate = datetime.datetime.strptime(daterange[1], '%Y-%j').date()
        except Exception:
            enddate = startdate
        ndates = (enddate - startdate).days
        dates = [startdate + datetime.timedelta(i) for i in range(ndates+1)]
        # for the first inventory key, how many GIPS inventories are there
        gipsinventories = self.inventories.values()[0][0]
        locationnames = [i.get_location() for i in gipsinventories]
        self.datacube = Datacube(self.variables, locationnames, dates)
        # collect results into datacube
        if len(self.inventories) > 0:
            self.aggregate()


def example1():
    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)

    # variable set
    variables = "tmax_conus, ndvi_large"
    variables = tuple([v.strip() for v in variables.split(',')])

    # time set
    daterange = "2014-193,2014-194"
    interval = "1-day"
    times = (daterange, interval)

    datarequest = Datarequest(variables, locations, times)

    datarequest.handle()

    datarequest.datacube.dump('handler_test.csv')

    set_trace()



# def example1():
#     # location set
#     source = "GADM2"
#     query = "HASC_1='US.NH'"
#     locations = (source, query)

#     # variable set
#     variables = "tmax_conus, ndvi_large"
#     variables = tuple([v.strip() for v in variables.split(',')])

#     # time set
#     daterange = "2014-193,2014-194"
#     interval = "1-day"
#     times = (daterange, interval)

#     result = handle(variables, locations, times)
#     print result


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



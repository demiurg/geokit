#!/usr/bin/env python

import os
import datetime
from collections import defaultdict
from dateutil import rrule
import commands

import numpy as np
import fiona

from gipsproject import GIPSproject
import config

from pdb import set_trace


class Datacube(object):

    def __init__(self, variables, locationnames, dates):
        # a variable has units and a physical definition
        # a location name is a unique reference to a spatial feature
        self.variables = variables
        self.locationnames = locationnames
        self.dates = dates
        self.nvariables = len(variables)
        self.nlocations = len(locationnames)
        self.ntimes = len(dates)
        self.dims = (len(self.variables), len(self.locationnames), len(dates))
        self.data = np.zeros((self.nvariables, self.nlocations, self.ntimes))
        self.mask = np.zeros_like(self.data, dtype=int)

    def insert(self, variable, locationname, date, value):
        ivar = self.variables.index(variable)
        iloc = self.locationnames.index(locationname)
        idate = self.dates.index(date)
        self.data[ivar, iloc, idate] = value
        self.mask[ivar, iloc, idate] = 1

    def load(self, data):
        if data.shape != self.dims:
            raise Exception('Data dimensions must be %s' % str(self.dims))
        self.data = data

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

    def aggregate_results(self):
        """ Each inventory is associated with a single location and GIPS project tree
        the project tree has one or more products. Each product provides data 
        for one or more variables. """
        locationnames = set()
        dates = set()
        for asset, item in self.inventories.items():
            inventories, params, info = item
            for inventory in inventories:
                dates.update(inventory.dates)
                locationnames.add(inventory.get_location())
        dates = list(dates)
        locationnames = list(locationnames)
        self.datacube = Datacube(self.variables, locationnames, dates)
        for asset, item in self.inventories.items():
            inventories, params, info = item
            for varset in info:
                variable, product, layer = varset
                for inventory in inventories:
                    try:
                        location = inventory.get_location()
                    except Exception:
                        print "could not get location"
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

    def initialize_data(self):
        # convert times to output dates
        daterange = self.times[0].split(',')
        interval, step = self.times[1].split('-')
        startdate = datetime.datetime.strptime(daterange[0], '%Y-%j').date()
        try:
            enddate = datetime.datetime.strptime(daterange[1], '%Y-%j').date()
        except Exception:
            enddate = startdate
        lookup = {'day':rrule.DAILY, 'week':rrule.WEEKLY, 'month':rrule.MONTHLY}
        self.out_dates = list(rrule.rrule(lookup[step], dtstart=startdate, until=enddate, interval=int(interval)))
        self.num_out_dates = len(self.out_dates)
        # get locationnames from the source

        # locationpath = str(config.locations[self.locations[0]]['path'])
        locationpath = self.filtered_locations()

        records = fiona.open(locationpath)
        key = str(config.locations[self.locations[0]]['key'])

        self.out_locationnames = []
        for record in records:
            self.out_locationnames.append(record['properties'][key])
        if len(self.out_locationnames) != len(set(self.out_locationnames)):
            raise Exception('location IDs are not unique')
        else:
            self.num_out_locationnames = len(self.out_locationnames)
        # create an empty datacube of the right dimensions 
        self.out_datacube = Datacube(self.variables, self.out_locationnames, self.out_dates)


    def filtered_locations(self):
        locationpath = str(config.locations[self.locations[0]]['path'])
        dirname, locationfile = os.path.split(locationpath)
        outpath = os.path.join(dirname, "TMP.shp")
        if os.path.exists(outpath):
            os.remove(outpath)
        layer = os.path.splitext(locationfile)[0]
        where = self.locations[1]
        sql = "\"select * FROM %s where %s\"" % (layer, where)
        cmd = "ogr2ogr -sql %s %s %s" % (sql, outpath, locationpath)
        result = commands.getstatusoutput(cmd)
        return outpath


    def reduce_results(self):

        set_trace()


    def handle(self):

        # use GIPS to create image outputs; create self.inventories
        self.run_gips_project()
        # determine the output dimensions of the data cube; create self.out_datacube
        self.initialize_data()
        # collect results by variable, location and date; create self.datecube
        self.aggregate_results()
        # reframe aggregated GIPS results into the output grid
        self.reduce_results()



def example1():

    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)

    # variable set
    variables = "ndvi_large"
    # variables = "ndvi_large, tmin_conus"
    variables = tuple([v.strip() for v in variables.split(',')])

    # time set
    daterange = "2014-191,2014-199"
    interval = "1-day"
    times = (daterange, interval)

    datarequest = Datarequest(variables, locations, times)
    datarequest.handle()
    datarequest.datacube.dump('handler_test.csv')




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



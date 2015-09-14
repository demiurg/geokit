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
        self.variables = sorted(variables)
        self.locationnames = sorted(locationnames)
        self.dates = sorted(dates)
        self.nvariables = len(variables)
        self.nlocations = len(locationnames)
        self.ntimes = len(dates)
        self.dims = (self.nvariables, self.nlocations, self.ntimes)
        self._data = np.zeros(self.dims)
        self._mask = np.zeros_like(self._data, dtype=int)

    def set(self, variable, locationname, date, value):
        ivar = self.variables.index(variable)
        iloc = self.locationnames.index(locationname)
        idate = self.dates.index(date)
        self._data[ivar, iloc, idate] = value
        self._mask[ivar, iloc, idate] = 1

    def get(self, variable, locationname, date):
        ivar = self.variables.index(variable)
        iloc = self.locationnames.index(locationname)
        idate = self.dates.index(date)
        if self._mask[ivar, iloc, idate] == 1:
            return self._data[ivar, iloc, idate]
        else:
            return None

    def dump(self, filepath):
        self._data.dump(filepath)

    def load(self, filepath):
        self._data = np.load(filepath)

    def mask(self, value):
        wmask = np.where(self._mask == 0)
        self._data[wmask] = value

    def __getitem__(self, key):
        ivar = self.variables.index(key)
        return self._data[ivar,:,:].squeeze()


class Datarequest(object):

    def __init__(self, variables, locations, times):
        self.locations = locations
        self.variables = variables
        self.times = times
        self.inventories = None
        self.datacube = None
        self.projid = None

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
            except Exception:
                commandparams[asset]['products'] = set([product])
        self.inventories = dict()
        for asset in commandparams.keys():
            products = list(commandparams[asset]['products'])
            res = commandparams[asset]['res']
            project = GIPSproject()
            project.set(asset, products, dates, key, site, where, res)
            inventory = project.run()
            if len(inventory) > 0:
                self.inventories[asset] = (inventory, commandparams[asset], productinfo[asset])
                self.projid = project.pid

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
        self.inv_datacube = Datacube(self.variables, locationnames, dates)
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
                            self.inv_datacube.set(variable, location, date, mean)

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
        dates = list(rrule.rrule(lookup[step], dtstart=startdate, until=enddate, interval=int(interval)))
        dates = [d.date() for d in dates]

        # get locationnames from the sql-filtered source
        # this will need to change when the data are in a database
        locationpath = self.filtered_locations()
        records = fiona.open(locationpath)
        os.remove(locationpath)

        key = str(config.locations[self.locations[0]]['key'])
        locationnames = []
        for record in records:
            locationnames.append(record['properties'][key])
        if len(locationnames) != len(set(locationnames)):
            raise Exception('location IDs are not unique')
        # create an empty datacube of the right dimensions 
        self.datacube = Datacube(self.variables, locationnames, dates)

    def filtered_locations(self):
        """ Create a temporary shapefile that has the filtered locations
        this won't be needed when the data are stored in a database """
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
        """ fit the GIPS results into the output grid """
        dates = self.datacube.dates
        for idxvar, variable in enumerate(self.variables):
            for idxloc, locationname in enumerate(self.datacube.locationnames):
                data = np.zeros(len(dates))
                count = np.zeros_like(data)
                for jdxdate, inv_date in enumerate(self.inv_datacube.dates):
                    found = False
                    for idxdate, date in enumerate(dates):
                        if idxdate < len(dates) - 1:
                            if inv_date >= dates[idxdate] and inv_date < dates[idxdate+1]:
                                found = True
                        else:
                            if inv_date >= dates[idxdate]:
                                found = True
                        if found is True:
                            value = self.inv_datacube.get(variable, locationname, inv_date)
                            if value is not None:
                                data[idxdate] += value
                                count[idxdate] += 1
                            break
                # there still might be missing values in the output grid so fill them
                wvalid = np.where(count != 0)[0]
                if len(wvalid) > 0:
                    for idxdate, date in enumerate(dates):
                        if count[idxdate] > 0:
                            value = data[idxdate]/count[idxdate]
                        else:
                            value = np.interp(idxdate, wvalid, data[wvalid])
                        self.datacube.set(variable, locationname, date, value)

    def handle(self):
        # use GIPS to create image outputs; create self.inventories
        self.run_gips_project()
        # determine the output dimensions of the data cube; create empty self.datacube
        self.initialize_data()
        # collect results by variable, location and date; create and fill self.inv_datecube
        self.aggregate_results()
        # reframe aggregated GIPS results into the output grid self.datacube
        self.reduce_results()


def example1():

    # variable set
    variables = ("ndvi_large", "tmin_conus")

    # location set
    source = "GADM2"
    query = "HASC_1='US.NH'"
    locations = (source, query)

    # time set
    daterange = "2014-180,2014-200"
    interval = "1-week"
    times = (daterange, interval)

    # create and fill the request
    datarequest = Datarequest(variables, locations, times)
    datarequest.handle()
    datarequest.datacube.dump('handler_test1.pkl')
    print datarequest.datacube['ndvi_large']
    print datarequest.datacube['tmin_conus']


def example2():

    # variable set
    variables = ("tave_global", "lswi_large")

    # location set
    source = "LargeLakesUS"
    query = "uuid='4b14eba8-b36b-4170-81b6-6924c3f4b9d3'"
    locations = (source, query)

    # time set
    daterange = "2014-178,2014-182"
    interval = "1-day"
    times = (daterange, interval)

    # create and fill the request
    datarequest = Datarequest(variables, locations, times)
    datarequest.handle()
    datarequest.datacube.dump('handler_test2.pkl')
    datarequest.datacube.mask(-9999.)
    print datarequest.datacube['tave_global']
    print datarequest.datacube['lswi_large']

    set_trace()


if __name__ == "__main__":
    # example1()
    example2()

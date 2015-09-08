#!/usr/bin/env python

import os
import sys
import glob
sys.path.insert(1, '/home/rbraswell/repo/gips')

from gips.core import SpatialExtent, TemporalExtent
from gips.utils import import_data_class
from gips.inventory import DataInventory, ProjectInventory

from pdb import set_trace


OUTDIR = '/atlas/projects/geokit/data'


class GIPSproject(object):

    def __init__(self):
        self.overwrite=True
        self.fetch=True
        self.interpolation=0
        self.tree=False
        self.crop=False
        self.chunksize=128.0
        self.days=None
        self.format='GTiff'
        self.notld=True
        self.numprocs=2
        self.pcov=0
        self.ptile=0
        self.sensors=None
        self.suffix=''
        self.tiles=None
        self.verbose=4
        self.ready = False
        self.pid = self.get_pid()
        self.outdir = os.path.join(OUTDIR, self.pid)

    def get_pid(self):
        dirs = glob.glob(os.path.join(OUTDIR, '*'))
        pids = [int(os.path.split(d)[1]) for d in dirs]
        try:
            pid = str(max(pids) + 1)
        except:
            pid = "0"
        return pid

    def set(self, asset, products, dates, key, site, where, res):
        print self.pid, asset, products, dates, key, site, where, res
        self.asset = asset
        self.products = products
        self.dates = dates
        self.key = key
        self.site = site
        self.where = where
        self.res = res
        self.ready = True

    def run(self):
        if not self.ready:
            raise Exception('must set parameters using set()')
        cls = import_data_class(self.asset)
        extents = SpatialExtent.factory(cls, self.site, self.key, self.where, self.tiles, self.pcov, self.ptile)
        tld = self.outdir
        invs = []
        for extent in extents:
            inv = DataInventory(cls, extent, TemporalExtent(self.dates, self.days), **vars(self))
            datadir = os.path.join(tld, extent.site.Value())
            if inv.numfiles > 0:
                inv.mosaic(datadir=datadir, tree=self.tree, overwrite=self.overwrite, res=self.res,
                           interpolation=self.interpolation, crop=self.crop)
                if os.path.exists(datadir):
                    inv = ProjectInventory(datadir)
                else:
                    continue
            invs.append(inv)
            inv.pprint()
        return invs


if __name__ == "__main__":
    # see example.py
    pass

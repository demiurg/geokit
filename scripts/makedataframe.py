#!/usr/bin/env python

import geopandas as gpd
import pandas as pd
import numpy as np

import cPickle as pickle

from pdb import set_trace


class GeoPanel(pd.Panel):
    def __init__(self, *args, **kwargs):
        super(GeoPanel, self).__init__(*args, **kwargs)
        self.locations = None

    def __getstate__(self):
        a_state = super(GeoPanel, self).__getstate__()
        b_state = self.__dict__
        return (a_state, b_state)

    def __setstate__(self, state):
        a_state, b_state = state
        self.__dict__ = b_state
        super(GeoPanel, self).__setstate__(a_state)


# class GeoPanel(object):
#     def __init__(self):
#         self.panel = None
#         self.locations = None



def main():

    shppath = '/atlas/projects/geokit/locations/gadm2_vtnh_3410.shp'
    gdf = gpd.GeoDataFrame.from_file(shppath)
    gdf.rename(columns={'HASC_2':'name'}, inplace=True)

    names = gdf['name']

    gds = gdf['geometry']

    gdf = gdf[['geometry']]
    gdf.index = names

    # gdf = gdf[['geometry','HASC_2']]
    # ng = len(gdf)

    rng = pd.date_range('1/1/2011', periods=100, freq='D')

    # tdf = gpd.GeoDataFrame()

    # gdf1 = gpd.GeoDataFrame(data[0,:,:].squeeze(), columns=rng)
    # gdf2 = gpd.GeoDataFrame(data[1,:,:].squeeze(), columns=rng)
    # panel = pd.Panel.from_dict({'g':gdf, 'v1':gdf1, 'v2':gdf2}, orient='minor')


    data = np.random.random((2,100,24))
    data[1,:,:] = 10.*(data[1,:,:] - data[1,:,:].min())
    # gdf1 = gpd.GeoDataFrame(data[0,:,:], index=rng, columns=names)
    # gdf2 = gpd.GeoDataFrame(data[1,:,:], index=rng, columns=names)
    df1 = pd.DataFrame(data[0,:,:], index=rng, columns=names)
    df2 = pd.DataFrame(data[1,:,:], index=rng, columns=names)


    # data = np.random.random((2,24,100))
    # data[1,:,:] = 10.*(data[1,:,:] - data[1,:,:].min())
    # gdf1 = gpd.GeoDataFrame(data[0,:,:], index=gds, columns=rng)
    # gdf2 = gpd.GeoDataFrame(data[1,:,:], index=gds, columns=rng)


    panel = pd.Panel.from_dict({'temp':df1, 'precip':df2})
    # geopanel = {'panel':panel, 'locations':gdf}

    # geopanel = GeoPanel.from_dict({'temp':df1, 'precip':df2})
    geopanel.locations = gdf


    set_trace()


    # geopanel = GeoPanel()
    # geopanel.panel = panel
    # geopanel.locations = gdf


    pickle.dump(geopanel, open(outfile, 'wb'))

    # panel.to_pickle('geopanel.pkl')


    x = pickle.load(open('geopanel.pkl'))


    set_trace()




if __name__ == "__main__":
    main()

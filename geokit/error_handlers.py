from geokit_tables.views import populate_table_handler
from layers.views import (
    process_shapefile_handler,
    gadm_layer_save_handler,
    vector_catalog_save_layer_handler
)


ERROR_HANDLERS = {
    'geokit_tables.views.populate_table': populate_table_handler,
    'layers.views.process_shapefile': process_shapefile_handler,
    'layers.views.vector_catalog_save_layer': vector_catalog_save_layer_handler,
}


def dispatch_error(job, *exc_info):
    ERROR_HANDLERS[job._func_name](*job._args)

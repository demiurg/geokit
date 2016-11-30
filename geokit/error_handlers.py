from geokit_tables.views import populate_table_handler


ERROR_HANDLERS = {
    'geokit_tables.views.populate_table': populate_table_handler,
}


def dispatch_error(job, *exc_info):
    ERROR_HANDLERS[job._func_name](*job._args)

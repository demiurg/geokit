import logging

from django.test import utils
from django.db import connection

from geokit.tests.util import make_tenant

logger = logging.getLogger('tests.util')

def pytest_addoption(parser):
    help_str = "Set up a test database and test tenant within it."
    parser.addoption("--setup-db",    action="store_true", help=help_str)
    parser.addoption("--teardown-db", action="store_true", help=help_str)

def pytest_configure(config):
    if config.getoption('setup_db'):
        logger.info("Setting up test DB with tenant.")
        utils.setup_test_environment()
        connection.creation.create_test_db(keepdb=True)
        make_tenant()

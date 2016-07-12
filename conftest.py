import logging

from django.test import utils
from django.db import connection

from geokit.tests.util import make_tenant

try:
    import geokit.settings.local
except Exception as e:
    raise type(e)("error importing required local settings file:", *e.args)

logger = logging.getLogger('tests.util')

def pytest_addoption(parser):
    """Add an option to py.test cmd line to set up test DB."""
    help_str = "Set up a test database and test tenant within it."
    parser.addoption("--setup-db",    action="store_true", help=help_str)

def pytest_configure(config):
    """If the user wishes it, bring DB into usable state for testing."""
    if config.getoption('setup_db'):
        logger.info("Setting up test DB and tenant.")
        utils.setup_test_environment()
        connection.creation.create_test_db(keepdb=True)
        make_tenant()

import unittest

import mock

from expressions import functions
from expressions.helpers import ExpressionResult


class TestJoin(unittest.TestCase):
    """Test functions.Join, mostly its eval class method.

    This is a pure unit test; the DB I/O is mock.patched.
    """
    def setUp(self):
        self.db_patcher = mock.patch('expressions.functions.connection')
        self.db_mock = self.db_patcher.start()
        self.addCleanup(self.db_patcher.stop)

        self.json = '{"a": 37, "b": 14, "c": [1, 2, 3]}' # fake payload

        self.db_mock.cursor().fetchall.return_value = (
            # spatial key
            # / layer props  tables key    payload  date range
            (1, '(ignored)', '(ignored)', self.json, 'dr1'),
            (1, '(ignored)', '(ignored)', self.json, 'dr2'),
            (2, '(ignored)', '(ignored)', self.json, 'dr1'),
            (2, '(ignored)', '(ignored)', self.json, 'dr2'),
            (3, '(ignored)', '(ignored)', self.json, 'dr1'),
            (3, '(ignored)', '(ignored)', self.json, 'dr2'),
        )

    def test_normal_case(self):
        """Confirm ExpressionResult object is correctly generated."""
        em = [ [self.json, self.json],
               [self.json, self.json],
               [self.json, self.json] ]
        expected = ExpressionResult(em, ['dr1', 'dr2'], [1, 2, 3])
        actual = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')

        self.assertEqual(expected, actual)

    def test_bad_args(self):
        #self.assertFalse(self.db_mock.cursor().fetchall.called)
        # bad layer & table input strings
        # TODO
        pass

    def test_bad_db_output(self):
        # bad output from DB?  What happens when DB is empty?
        # TODO
        pass

if __name__ == '__main__':
    unittest.main()

import unittest

import mock

from expressions import functions
from expressions.helpers import ExpressionResult


class TestJoin(unittest.TestCase):
    """Test functions.Join, mostly its eval class method."""

    @mock.patch('expressions.functions.connection')
    def test_normal_case(self, db_conn_mock):
        """Confirm ExpressionResult object is correctly generated.

        This is a pure unit test; the DB I/O is mock.patched.
        """
        json = '{"a": 37, "b": 14, "c": [1, 2, 3]}' # fake payload
        # spatial key                         date range
        #    |  layer props  tables key  payload  |
        db_conn_mock.cursor().fetchall.return_value = (
            (1, '(ignored)', '(ignored)', json, 'dr1'),
            (1, '(ignored)', '(ignored)', json, 'dr2'),
            (2, '(ignored)', '(ignored)', json, 'dr1'),
            (2, '(ignored)', '(ignored)', json, 'dr2'),
            (3, '(ignored)', '(ignored)', json, 'dr1'),
            (3, '(ignored)', '(ignored)', json, 'dr2'),
        )

        em = [ [json, json], [json, json], [json, json], ]

        expected = ExpressionResult(em, ['dr1', 'dr2'], [1, 2, 3])
        actual = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')

        self.assertEqual(expected, actual)

    @mock.patch('expressions.functions.connection')
    def test_bad_args(self, db_conn_mock):
        # bad layer & table input strings
        # TODO
        pass

    @mock.patch('expressions.functions.connection')
    def test_bad_db_output(self, db_conn_mock):
        # bad output from DB?  What happens when DB is empty?
        # TODO
        pass

if __name__ == '__main__':
    unittest.main()

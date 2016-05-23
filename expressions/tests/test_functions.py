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

        self.fetchall = self.db_mock.cursor().fetchall
        self.fetchall.return_value = (
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

    def test_no_underscores_in_args(self):
        """Expect an exception when arguments don't have __ separators."""
        with self.assertRaises(ValueError):
            actual = functions.Join.eval('HI', 'MOM')
        self.assertFalse(self.fetchall.called)

    def test_excessive_underscores_in_args(self):
        """Expect an exception when arguments have too many __ separators."""
        with self.assertRaises(ValueError):
            actual = functions.Join.eval('DINNER__SOUNDS__GREAT',
                                         'YEAH__FRIDAY__SEE__YOU__THEN')
        self.assertFalse(self.fetchall.called)

    def test_no_db_output(self):
        """Confirm good behavior when no data is available."""
        self.fetchall.return_value = ()
        expected = ExpressionResult()
        actual = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')
        self.assertEqual(expected, actual)


if __name__ == '__main__':
    unittest.main()

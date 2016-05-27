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

        self.json = {"a": 37, "b": 14, "c": [1, 2, 3]} # fake payload

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


class TestExtract(unittest.TestCase):
    """Test functions.Extract, mostly its eval class method.

    This is a pure unit test; any DB I/O is mock.patched.
    """
    def setUp(self):
        self.apps_patcher = mock.patch('expressions.functions.apps')
        self.apps_mock = self.apps_patcher.start()
        self.addCleanup(self.apps_patcher.stop)
        self.evaluate = self.apps_mock.get_model().objects.get().evaluate

        # convenient data for making ExpressionResults
        self.payload = {"a": 37, "b": 14, "c": [1, 2, 3]}
        self.t_key = [1, 2, 3]
        self.s_key  = [4, 5, 6]

    def test_mocking(self):
        """Meta-test to confirm convoluted mocking is functioning"""
        self.assertFalse(self.evaluate.called)
        functions.Extract.eval('what', 'ever')
        self.assertTrue(self.evaluate.called)

    def test_normal_case(self):
        """A normal call should have predictable outputs.

        It should also preserve spatial & temporal keys however."""
        p = self.payload
        i = [ [p, p, p, p], # input array
              [p, p, p, p],
              [p, p, p, p],
              [p, p, p, p] ]
        self.evaluate.return_value = ExpressionResult(i, self.t_key, self.s_key)
        o = [ [37, 37, 37, 37], # output array
              [37, 37, 37, 37],
              [37, 37, 37, 37],
              [37, 37, 37, 37] ]
        expected = ExpressionResult(o, self.t_key, self.s_key)
        actual = functions.Extract.eval('a', '(ignored)')
        self.assertEqual(expected, actual)

    def test_input_expression_type_logic(self):
        """No DB access should occur when input is an ExpressionResult."""
        p = self.payload
        i = [ [p, p, p, p] ] # input array
        er_input = ExpressionResult(i, self.t_key, self.s_key)
        actual = functions.Extract.eval('a', er_input)
        self.evaluate.assert_not_called()

    def test_input_expression_result(self):
        """ExpressionResults used as inputs should behave normally."""
        p = self.payload
        i = [ [p, p, p, p], # input array
              [p, p, p, p],
              [p, p, p, p],
              [p, p, p, p] ]
        er_input = ExpressionResult(i, self.t_key, self.s_key)
        o = [ [37, 37, 37, 37], # output array
              [37, 37, 37, 37],
              [37, 37, 37, 37],
              [37, 37, 37, 37] ]
        expected = ExpressionResult(o, self.t_key, self.s_key)
        actual = functions.Extract.eval('a', er_input)
        self.assertEqual(expected, actual)

    def test_invalid_key(self):
        """On key not found, raise ValueError as per usual."""
        p = self.payload
        i = [ [p, p, p, p] ] # input array
        self.evaluate.return_value = ExpressionResult(i, self.t_key, self.s_key)
        with self.assertRaises(KeyError):
            actual = functions.Extract.eval('d', '(ignored)')

    def test_model_exception(self):
        """Confirm exception propagates when model raises an exception.

        Something like this should occur when results are zero or >1"""
        # make the object query mock raise an exception
        self.apps_mock.get_model().objects.get.side_effect = Exception('derp')
        with self.assertRaises(Exception):
            functions.Extract.eval('should', 'break')


class TestExtractJoin(unittest.TestCase):
    """Test EXTRACT(JOIN(...)) to confirm interoperability.

    This is a pure unit test; any DB I/O is mock.patched.
    """
    def setUp(self):
        """Prepare mocks & test data for testing."""
        # mocking for Join.eval
        self.db_patcher = mock.patch('expressions.functions.connection')
        self.db_mock = self.db_patcher.start()
        self.addCleanup(self.db_patcher.stop)
        self.fetchall = self.db_mock.cursor().fetchall

        # test data
        self.json = {"a": 37, "b": 14, "c": [1, 2, 3]} # fake payload
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

    def test_no_raising(self):
        """Confirm the base case raises no exceptions."""
        # this technically breaks the meaning of failing a test vs. errors
        # preventing a test from completing, but it's close enough.
        join_rv = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')
        functions.Extract.eval('a', join_rv)

    def test_normal_case(self):
        """Confirm expected output from calling EXTRACT(JOIN(...))."""
        o = [ [37, 37], # output array
              [37, 37],
              [37, 37] ]
        expected = ExpressionResult(o, ['dr1', 'dr2'], [1, 2, 3])
        join_rv = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')
        actual = functions.Extract.eval('a', join_rv)
        self.assertEqual(expected, actual)

    @mock.patch('expressions.functions.apps')
    def test_stored_expr(self, apps_mock):
        """As normal case but feed JOIN result in through mocked DB fetch."""
        # mock Expression.objects.get().evaluate to return a particular
        # ExpressionResult generated by a real Join.eval call
        self.evaluate = apps_mock.get_model().objects.get().evaluate
        join_rv = functions.Join.eval('lt__ln__lf', 'tt__tn__tf')
        self.evaluate.return_value = join_rv
        # set up expected result of EXTRACT(JOIN(...))
        o = [ [37, 37], # output array
              [37, 37],
              [37, 37] ]
        expected = ExpressionResult(o, ['dr1', 'dr2'], [1, 2, 3])
        # get actual result and compare to expectation
        actual = functions.Extract.eval('a', 'trigger-Expression-query-pls')
        self.assertEqual(expected, actual)

if __name__ == '__main__':
    unittest.main()

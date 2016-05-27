from datetime import date
import unittest

from django.contrib.auth.models import User
from django.test import TestCase

import numpy as np
import sympy
from sympy.core.cache import clear_cache
import factory
import mock
from psycopg2.extras import DateRange

from expressions.models import Expression, FormVariable
from expressions.helpers import ExpressionResult
from expressions import functions
from layers.models import Layer, Feature


class TestExpressionBase(unittest.TestCase):
    """Common features for all Expression tests.

    Currently just a mixin for User creation and sympy cache clearing."""
    def std_setup(self):
        self.user = User(username='tester')
        clear_cache()


class OneDimensionalExpressionTests(TestExpressionBase):
    """Test scalar features of Expression."""
    def setUp(self):
        self.std_setup()

    def test_no_substitutions(self):
        """Check simple arithmetic without additional object fetch."""
        exp = Expression(expression_text='1+2')
        self.assertEqual(exp.evaluate(self.user).unpack(), 3)

    @mock.patch.object(Expression, 'resolve_sub_expression')
    def test_sub_expressions(self, rse_mock):
        """Confirm expressions can be nested."""
        rse_mock.return_value = Expression(name='exp1', expression_text='1+2')
        exp = Expression(expression_text='expression__exp1 + 1')
        result = exp.evaluate(self.user).unpack()
        self.assertEqual(result, 4)

    @mock.patch.object(Expression, 'resolve_form_variable')
    def test_form_variables(self, rfv_mock):
        """Check loading & disambiguation of form variables.
        
        A form variable needs to be scoped to the current user."""
        rfv_mock.side_effect = lambda _, user: {
            'tester':  FormVariable(name='var1', value=3),
            'tester2': FormVariable(name='var1', value=4),
        }[user.username]

        exp = Expression(expression_text='form__var1 + 1')
        results = ( exp.evaluate(self.user).unpack(),
                    exp.evaluate(User(username='tester2')).unpack() )
        self.assertEqual(results, (4, 5))


class TwoDimensionalExpressionTest(TestExpressionBase):
    """Test multidimensional values and aggregations thereof."""
    def setUp(self):
        self.std_setup()

    @mock.patch('expressions.models.sympy.sympify')
    def test_mean_across_nothing(self, sympify_mock):
        """Confirm that the mean of an empty dataset is NaN."""
        sympify_mock.return_value = ExpressionResult()

        exp = Expression(
            expression_text='layer__var1', # ignored due to mocking
            aggregate_dimension='TM',
            aggregate_method='MEA'
        )
        actual = exp.evaluate(self.user).unpack()
        self.assertTrue(np.isnan(actual))

    @mock.patch('expressions.models.Feature.objects.filter')
    def test_empty_layer(self, fof_mock):
        """Empty layer should result in empty ExpressionResult."""
        fof_mock.return_value = []
        expected = ExpressionResult()
        actual = Expression(expression_text='layer__OHAI').evaluate(self.user)
        self.assertEqual(expected, actual)

    @mock.patch('layers.models.Feature.objects.filter')
    def test_mean_across_space(self, fof_mock):
        """Take the mean of a value aggregated across several Features."""
        fof_mock.return_value = [
            Feature(properties={'var1': 1}),
            Feature(properties={'var1': 2}),
            Feature(properties={'var1': 3}),
            Feature(properties={'var1': 4}),
            Feature(properties={'var1': 5}),
        ]

        exp = Expression(
            expression_text='layer__var1',
            aggregate_dimension='SP',
            aggregate_method='MEA'
        )
        result = exp.evaluate(self.user).unpack()
        self.assertEqual(result, 3.0)

    @mock.patch('expressions.models.sympy.sympify')
    def test_mean_across_time(self, sympify_mock):
        """Verify computation of a mean across time-series data.

        For now this is just mocking an ExpressionResult since Expression has
        no way to directly load geokit_table.Record objects.
        """
        sympify_mock.return_value = ExpressionResult(
                [[1, 2, 3], [2, 4, 6], [5, 10, 15]])
        exp = Expression(
            expression_text='layer__var1', # ignored due to mocking
            aggregate_dimension='TM',
            aggregate_method='MEA'
        )
        expected = ExpressionResult([[2], [4], [10]])
        actual = exp.evaluate(self.user)
        self.assertEqual(expected, actual)


class TestLocalFunctions(TestExpressionBase):
    """Test expressions.functions inside an expression.

    Currently just EXTRACT & JOIN.  I/O is mocked so this is a unit test.
    """
    def setUp(self):
        self.std_setup()
        # mock Join.eval
        eval_patcher = mock.patch('expressions.functions.Join.eval')
        self.eval_mock = eval_patcher.start()
        self.addCleanup(eval_patcher.stop)
        self.eval_mock.return_value = ExpressionResult()

    def test_join(self):
        """Ask Expression to handle a JOIN."""
        self.eval_mock.return_value = ExpressionResult()
        exp = Expression(expression_text='JOIN(lt__ln__lf, tt__tn__tf)')
        actual = exp.evaluate(self.user)
        # not assertIs because Expression always returns a new ExpressionResult
        self.assertEqual(self.eval_mock.return_value, actual)
        self.assertTrue(self.eval_mock.called)

    @mock.patch('expressions.functions.Extract.eval')
    def test_extract(self, eval_mock):
        """Ask Expression to handle an EXTRACT."""
        eval_mock.return_value = ExpressionResult()
        exp = Expression(name='expr',
                         expression_text='EXTRACT(test_col_name, test_expr)')
        actual = exp.evaluate(self.user)
        # not assertIs because Expression always returns a new ExpressionResult
        self.assertEqual(eval_mock.return_value, actual)
        self.assertTrue(eval_mock.called)

    def test_nested_functions(self):
        """Have EXTRACT use a value from a JOIN expression."""
        self.eval_mock.return_value = ExpressionResult()
        text = 'EXTRACT(test_col_name, JOIN(lt__ln__lf, tt__tn__tf))'
        exp = Expression(name='expr', expression_text=text)
        actual = exp.evaluate(self.user)
        self.assertEqual(self.eval_mock.return_value, actual)
        self.assertTrue(self.eval_mock.called)

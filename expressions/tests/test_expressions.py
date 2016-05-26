from datetime import date

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


class UserFactory(factory.Factory):
    class Meta:
        model = User

    username = 'tester'
    is_staff = False
    is_superuser = False


def patched_resolve_sub_expression(self, expression_name):
    return Expression(name='exp1', expression_text='1+2')


def patched_resolve_form_variable(self, variable_name, user):
    if user.username == 'tester1':
        return FormVariable(name='var1', value=3, user=UserFactory.create())
    elif user.username == 'tester2':
        return FormVariable(name='var1', value=4, user=UserFactory.create())


class OneDimensionalExpressionTests(TestCase):
    def setUp(self):
        clear_cache()

    def test_no_substitutions(self):
        exp = Expression(name='exp', expression_text='1+2')
        self.assertEqual(exp.evaluate(UserFactory.create()).unpack(), 3)

    @mock.patch.object(Expression, 'resolve_sub_expression',
            patched_resolve_sub_expression)
    def test_sub_expressions(self):
        exp = Expression(name='exp_with_subs', expression_text='expression__exp1 + 1')
        self.assertEqual(exp.evaluate(UserFactory.create()).unpack(), 4)

    @mock.patch.object(Expression, 'resolve_form_variable', patched_resolve_form_variable)
    def test_form_variables(self):
        exp = Expression(name='exp_with_formvar', expression_text='form__var1 + 1')
        self.assertEqual(exp.evaluate(UserFactory.create(username='tester1')).unpack(), 4)
        self.assertEqual(exp.evaluate(UserFactory.create(username='tester2')).unpack(), 5)


def return_two_dim_spatial_dom_features(*args, **kwargs):
    layer = Layer()
    return [
        Feature(layer=layer, geometry=None, properties={'var1': 1}),
        Feature(layer=layer, geometry=None, properties={'var1': 2}),
        Feature(layer=layer, geometry=None, properties={'var1': 3}),
        Feature(layer=layer, geometry=None, properties={'var1': 4}),
        Feature(layer=layer, geometry=None, properties={'var1': 5}),
    ]


class TwoDimensionalExpressionTest(TestCase):
    def setUp(self):
        clear_cache()

    @mock.patch('expressions.models.sympy.sympify')
    def test_mean_across_nothing(self, sympify_mock):
        """Confirm that the mean of an empty dataset is NaN."""
        er = ExpressionResult()
        sympify_mock.return_value = er

        exp = Expression(
            name='exp_over_space',
            expression_text='layer__var1', # ignored due to mocking
            aggregate_dimension='TM',
            aggregate_method='MEA'
        )
        actual = exp.evaluate(UserFactory.create()).unpack()
        self.assertTrue(np.isnan(actual))

    @mock.patch('layers.models.Feature.objects.filter',
            return_two_dim_spatial_dom_features)
    def test_mean_across_space(self):
        """Take the mean of a value aggregated across several Features."""
        exp = Expression(
            name='exp_over_space',
            expression_text='layer__var1',
            aggregate_dimension='SP',
            aggregate_method='MEA'
        )
        actual = exp.evaluate(UserFactory.create()).unpack()
        self.assertEqual(3.0, actual)

    @mock.patch('expressions.models.sympy.sympify')
    def test_mean_across_time(self, sympify_mock):
        """Verify computation of a mean across time-series data.

        For now this is just mocking an ExpressionResult since Expression has
        no way to directly load geokit_table.Record objects.
        """
        er = ExpressionResult([[1, 2, 3], [2, 4, 6], [5, 10, 15]])
        sympify_mock.return_value = er
        exp = Expression(
            name='exp_over_time',
            expression_text='layer__var1', # ignored due to mocking
            aggregate_dimension='TM',
            aggregate_method='MEA'
        )
        expected = ExpressionResult([[2], [4], [10]])
        actual = exp.evaluate(UserFactory.create())
        self.assertEqual(expected, actual)


class TestEmptyLayer(TestCase):
    def setUp(self):
        clear_cache()

    @mock.patch('expressions.models.Feature.objects.filter')
    def test_empty_layer(self, emfof_mock):
        emfof_mock.return_value = []
        exp = Expression(name='empty_expr', expression_text='layer__OHAI')
        expected = ExpressionResult()
        actual = exp.evaluate(UserFactory.create())
        self.assertEqual(expected, actual)


class TestLocalFunctions(TestCase):
    """Test local functions inside an expression.

    Currently just EXTRACT & JOIN.  I/O is mocked so this is a unit test.
    """
    def setUp(self):
        clear_cache() # so sympy doesn't carry state between tests

        # mock Join.eval
        eval_patcher = mock.patch('expressions.functions.Join.eval')
        self.eval_mock = eval_patcher.start()
        self.addCleanup(eval_patcher.stop)
        self.eval_mock.return_value = ExpressionResult()

    def test_join(self):
        """Ask Expression to handle a JOIN."""
        self.eval_mock.return_value = ExpressionResult()
        exp = Expression(name='expr',
                         expression_text='JOIN(lt__ln__lf, tt__tn__tf)')
        actual = exp.evaluate(UserFactory.create())
        # not assertIs because Expression always returns a new ExpressionResult
        self.assertEqual(self.eval_mock.return_value, actual)
        self.assertTrue(self.eval_mock.called)

    @mock.patch('expressions.functions.Extract.eval')
    def test_extract(self, eval_mock):
        """Ask Expression to handle an EXTRACT."""
        eval_mock.return_value = ExpressionResult()
        exp = Expression(name='expr',
                         expression_text='EXTRACT(test_col_name, test_expr)')
        actual = exp.evaluate(UserFactory.create())
        # not assertIs because Expression always returns a new ExpressionResult
        self.assertEqual(eval_mock.return_value, actual)
        self.assertTrue(eval_mock.called)

    def test_nested_functions(self):
        """Have EXTRACT use a value from a JOIN expression."""
        self.eval_mock.return_value = ExpressionResult()
        text = 'EXTRACT(test_col_name, JOIN(lt__ln__lf, tt__tn__tf))'
        exp = Expression(name='expr', expression_text=text)
        actual = exp.evaluate(UserFactory.create())
        self.assertEqual(self.eval_mock.return_value, actual)
        self.assertTrue(self.eval_mock.called)

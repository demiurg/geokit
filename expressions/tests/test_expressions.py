from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase

from numpy import mean
import sympy
import factory
import mock
from psycopg2.extras import DateRange

from expressions.models import Expression, FormVariable
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
    def test_no_substitutions(self):
        exp = Expression(name='exp', expression_text='1+2')
        self.assertEqual(exp.evaluate(UserFactory.create()).unpack(), 3)

    @mock.patch.object(Expression, 'resolve_sub_expression', patched_resolve_sub_expression)
    def test_sub_expressions(self):
        exp = Expression(name='exp_with_subs', expression_text='expression_exp1 + 1')
        self.assertEqual(exp.evaluate(UserFactory.create()).unpack(), 4)

    @mock.patch.object(Expression, 'resolve_form_variable', patched_resolve_form_variable)
    def test_form_variables(self):
        exp = Expression(name='exp_with_formvar', expression_text='form_var1 + 1')
        self.assertEqual(exp.evaluate(UserFactory.create(username='tester1')).unpack(), 4)
        self.assertEqual(exp.evaluate(UserFactory.create(username='tester2')).unpack(), 5)


layer = Layer()
two_dim_spatial_dom_features = [
    Feature(layer=layer, geometry=None, properties={'var1': 1}),
    Feature(layer=layer, geometry=None, properties={'var1': 2}),
    Feature(layer=layer, geometry=None, properties={'var1': 3}),
    Feature(layer=layer, geometry=None, properties={'var1': 4}),
    Feature(layer=layer, geometry=None, properties={'var1': 5}),
]
two_dim_temporal_dom_features = [
    Feature(layer=layer, geometry=None, properties={'var1_20161': 1, 'var1_20162': 2, 'var1_2016_3': 3})
]

def return_two_dim_spatial_dom_features(*args, **kwargs):
    return two_dim_spatial_dom_features


class TwoDimensionalExpressionTest(TestCase):
    @mock.patch('layers.models.Feature.objects.filter', return_two_dim_spatial_dom_features)
    def test_over_space(self):
        exp = Expression(
            name='exp_over_space',
            expression_text='layer_var1',
            aggregate_dimension='SP',
            aggregate_method='MEA'
        )
        self.assertEqual(
            exp.evaluate(UserFactory.create()).vals,
            sympy.Matrix([[1], [2], [3], [4], [5]])
        )

    @mock.patch.object(Expression, 'spatial_domain_features', two_dim_temporal_dom_features)
    def test_over_time(self):
        exp = Expression(
            name='exp_over_time',
            expression_text='layer_var1',
            temporal_domain=DateRange(date(2016, 1, 2), date(2016, 1, 3)),
            aggregate_dimension='TM',
            aggregate_method='MEA'
        )
        self.assertEqual(
            exp.evaluate(UserFactory.create()),
            mean([2, 3])
        )

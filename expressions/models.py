import re
import numpy
import scipy.stats
import sympy

from django.apps import apps
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField, HStoreField
from django.utils.functional import cached_property

from layers.models import Feature

from expressions.helpers import ExpressionResult, evaluate_over_matrices
from expressions.functions import GEOKIT_FUNCTIONS


class FormVariable(models.Model):
    name = models.CharField(max_length=100)
    value = models.TextField()
    user = models.ForeignKey(User)

    def save(self, *args, **kwargs):
        """
        If a user resubmits a form, the new bindings should overwrite the
        existing ones.
        """
        FormVariable.objects.filter(name=self.name, user=self.user).delete()

        super(FormVariable, self).save(*args, **kwargs)

    def deserialize(self):
        """
        Currently, variables that are objects or iterables are stored in the
        database using their textual representation. While this is probaly
        not a good long term solution, this method deserializes these values.
        """
        OBJECT_RE = re.compile(r'^<(\w+): (\d+)>$')
        ARRAY_RE = re.compile(r'^\[(.+)\]$')
        model_name_map = {
            'Feature': 'layers.Feature',
        }

        object_match = re.match(OBJECT_RE, self.value)
        array_match = re.match(ARRAY_RE, self.value)

        if object_match:
            model_class = apps.get_model(model_name_map[object_match.group(1)])
            object_id = object_match.group(2)
            return model_class.objects.get(pk=object_id)
        elif array_match:
            items = re.split(r', *', array_match.group(1))

            deserialized_items = []
            for item in items:
                object_match = re.match(OBJECT_RE, item)
                if object_match:
                    model_class = apps.get_model(model_name_map[object_match.group(1)])
                    object_id = object_match.group(2)
                    deserialized_items.append(model_class.objects.get(pk=object_id))
                else:
                    deserialized_items.append(item)
            return deserialized_items
        else:
            return self.value


class InvalidVariableTypeError(Exception):
    def __init__(self, variable_type):
        self.variable_type = variable_type
        self.msg = "%s is not a valid variable type" % variable_type

    def __str__(self):
        return self.msg


class InvalidDimensionError(Exception):
    def __init__(self, dimension):
        self.dimension = dimension
        self.msg = "%s is not a valid dimension to aggregate over" % dimension

    def __str__(self):
        return self.msg


def validate_expression_text(expression_text):
    from builder.models import FormVariableField

    return
    try:
        expr = sympy.sympify(expression_text, evaluate=False)
    except sympy.SympifyError:
        raise ValidationError('Not a valid expression.')

    for atom in expr.atoms():
        # For now only numbers, subexpressions, and form variables can be used
        # in expressions. This will eventually include other symbols such as
        # values from the data cube.
        if isinstance(atom, sympy.Symbol):
            if Expression.objects.filter(name=str(atom)).count() < 1 and\
                    FormVariableField.objects.filter(variable_name=str(atom)).count() < 1:
                raise ValidationError(
                    'There is no expression or form variable with the name {0}'.format(str(atom)))
        elif not isinstance(atom, sympy.Number):
            raise ValidationError('Only numbers, form variables, and other'
                                  'expressions may be used in expressions')


AGG_DIM_CHOICES = (
    ('SP', 'Across space'),
    ('TM', 'Across time'),
    ('NA', 'Do not aggregate'),
)

AGG_METHOD_CHOICES = (
    ('MEA', 'Mean'),
    ('MED', 'Median'),
    ('MOD', 'Mode'),
    ('RAN', 'Range'),
    ('STD', 'Std dev'),
)


class Expression(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    expression_text = models.TextField(validators=[validate_expression_text])
    units = models.CharField(max_length=50, null=True, blank=True)
    spatial_domain_features = models.ManyToManyField(Feature, blank=True)
    temporal_domain = DateRangeField(null=True, blank=True)
    filters = ArrayField(HStoreField(), null=True, blank=True)
    aggregate_method = models.CharField(max_length=3, choices=AGG_METHOD_CHOICES, null=True, blank=True)
    aggregate_dimension = models.CharField(max_length=2, choices=AGG_DIM_CHOICES, default='NA')

    def evaluate(self, user):
        expr = sympy.sympify(self.expression_text, locals=GEOKIT_FUNCTIONS, evaluate=False)

        if type(expr) == ExpressionResult:
            return expr

        atoms = expr.atoms()
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

        variables = self.resolve_symbols(symbols, user)

        result = evaluate_over_matrices(expr, variables)
        temporal_key = variables[0][1].temporal_key if variables else []
        spatial_key = variables[0][1].spatial_key if variables else []

        return ExpressionResult(result, temporal_key, spatial_key)

    @cached_property
    def dimensions(self):
        expr = sympy.sympify(self.expression_text, evaluate=False)

        atoms = expr.atoms()
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

        if len(symbols) == 0:
            # Nothing to resolve, so it's just the dimensions of the spatial/temporal domain.
            # For now, we'll just return 1x1
            return {'width': 1, 'height': 1}
        else:
            # We'll deal with this later
            return {'width': 'unknown', 'height': 'unkown'}

    def resolve_symbols(self, symbols, user, feature=None):
        substitutions = []

        for symbol in symbols:
            symbol_type, symbol_name = str(symbol).split('_')

            if symbol_type == 'expression':
                val = self.resolve_sub_expression(symbol_name).evaluate(user)
            elif symbol_type == 'form':
                val = ExpressionResult.scalar(self.resolve_form_variable(symbol_name, user).value)
            elif symbol_type == 'layer':
                val = self.resolve_layer_variable(symbol_name)
            else:
                raise InvalidVariableTypeError(symbol_type)

            substitutions.append((symbol, val))

        return substitutions

    def resolve_sub_expression(self, expression_name):
        return Expression.objects.filter(name=expression_name).first()

    def resolve_form_variable(self, variable_name, user):
        return FormVariable.objects.get(name=variable_name, user=user)

    def resolve_layer_variable(self, variable_name):
        features = Feature.objects.filter(properties__has_key=variable_name)
        var_value = [[feature.properties[variable_name]] for feature in features]
        spatial_key = [[feature.pk] for feature in features]

        return ExpressionResult(var_value, spatial_key=spatial_key)

    def aggregate_by_method(self, vals):
        if self.aggregate_method == 'MEA':
            return numpy.mean(vals)
        elif self.aggregate_method == 'MED':
            return numpy.median(vals)
        elif self.aggregate_method == 'MOD':
            return scipy.stats.mode(vals)[0][0]
        elif self.aggregate_method == 'RAN':
            return numpy.ptp(vals)
        elif self.aggregate_method == 'STD':
            return numpy.std(vals)

    def __str__(self):
        return self.name

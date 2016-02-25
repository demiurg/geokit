import re
import sympy

from django.apps import apps
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models
from django.contrib.postgres.fields import ArrayField, DateRangeField, HStoreField

from layers.models import Feature


EXPRESSION_TYPES = (
    ('arith', 'arithmetic'),
    ('collec', 'form variable collection'),
    ('filter', 'filter'),
    ('map', 'map'),
    ('reduce', 'reduce'),
)


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
    spatial_domain_features = models.ManyToManyField(Feature, blank=True)
    temporal_domain = DateRangeField(null=True, blank=True)
    filters = ArrayField(HStoreField(), null=True, blank=True)
    aggregate_method = models.CharField(max_length=3, choices=AGG_METHOD_CHOICES, null=True, blank=True)
    aggregate_dimension = models.CharField(max_length=2, choices=AGG_DIM_CHOICES, default='NA')

    def evaluate(self, user, extra_substitutions={}):
        expr = sympy.sympify(self.expression_text, evaluate=False)

        atoms = expr.atoms()
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)
        substitutions = []

        for symbol in symbols:
            symbol_type, symbol_name = symbol.split(':')

            if symbol_type == 'expression':
                val = self.resolve_sub_expression(str(symbol)).evaluate(user)

            substitutions.append((symbol, val))

        return sympy.simplify(expr.subs(substitutions))

    def resolve_sub_expression(self, expression_name):
        return Expression.objects.filter(name=expression_name).first()

    def __str__(self):
        return self.name

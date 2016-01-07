import re
import sympy

from django.apps import apps
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.contrib.gis.db import models


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


class Expression(models.Model):
    name = models.CharField(max_length=100)
    expression_type = models.CharField(max_length=6, choices=EXPRESSION_TYPES)
    expression_text = models.TextField(validators=[validate_expression_text])
    # The only "collections" we currently have are layers, but this will eventually become
    # more general as other datasets are available.
    input_collection = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True)

    def clean(self):
        if not self.input_collection \
           and self.expression_type != 'arith' \
           and self.expression_type != 'collec':
            raise ValidationError({'input_collection': 'filter, map, and reduce expression need an input collection'})

        if (self.expression_type == 'map' \
            or self.expression_type == 'filter' \
            or self.expression_type == 'reduce') \
            and (self.input_collection.expression_type != 'collec' \
                 and self.input_collection.expression_type != 'map' \
                 and self.input_collection.expression_type != 'filter'):
            raise ValidationError({'input_collection': 'This is not a valid input collection expression'})

    def evaluate(self, user, extra_substitutions={}):
        def evaluate_on_collection_item(item):
            return self.evaluate_arithmetic(user, item.properties)

        def reduce_on_collection_item(accum, item):
            if isinstance(accum, sympy.Number):
                return evaluate_on_collection_item(item) + accum
            else:
                # It is the first iteration, accum is the first object in the collection
                return evaluate_on_collection_item(item) + evaluate_on_collection_item(accum)

        def map_on_collection_item(item):
            val = evaluate_on_collection_item(item)
            item.properties[self.name + '_value'] = val
            return item

        if self.expression_type == 'arith':
            return self.evaluate_arithmetic(user, extra_substitutions)
        elif self.expression_type == 'collec':
            return FormVariable.objects.get(name=self.expression_text, user=user).deserialize()
        elif self.expression_type == 'map':
            return map(map_on_collection_item, self.input_collection.evaluate(user))
        elif self.expression_type == 'filter':
            return filter(evaluate_on_collection_item, self.input_collection.evaluate(user))
        elif self.expression_type == 'reduce':
            return reduce(reduce_on_collection_item, self.input_collection.evaluate(user))

    def evaluate_arithmetic(self, user, extra_substitutions={}):
        expr = sympy.sympify(self.expression_text, evaluate=False)
        atoms = expr.atoms()
        # List of symbols that need to be resolved.
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

        # Currently symbols can only resolve to subexpressions or form variables.
        substitutions = []
        for symbol in symbols:
            subexp = Expression.objects.filter(name=str(symbol)).first()
            if subexp:
                val = subexp.evaluate(user)
            elif str(symbol) in extra_substitutions.keys():
                try:
                    val = float(extra_substitutions[str(symbol)])
                except (ValueError, TypeError):
                    return 'undefined'
            else:
                if not user.is_authenticated():
                    return 'undefined'
                form_var = FormVariable.objects.filter(name=str(symbol), user=user).first()
                if not form_var:
                    return 'undefined'
                val = form_var.value
            substitutions.append((symbol, val))

        return sympy.simplify(expr.subs(substitutions))

    def evaluation_query(self, request):
        return "SELECT to_json(evaluate_expression({0}, {1}, $1::json))".format(self.id, request.user.id)

    def __str__(self):
        return self.name

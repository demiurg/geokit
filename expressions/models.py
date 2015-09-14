import sympy

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models

from builder.models import FormVariableField


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


def validate_expression_text(expression_text):
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
    expression_text = models.TextField(validators=[validate_expression_text])

    def evaluate(self, request):
        expr = sympy.sympify(self.expression_text, evaluate=False)
        atoms = expr.atoms()
        # List of symbols that need to be resolved.
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

        # Currently symbols can only resolve to subexpressions or form variables.
        substitutions = []
        for symbol in symbols:
            subexp = Expression.objects.filter(name=str(symbol)).first()
            if subexp:
                val = subexp.evaluate(request)
            else:
                form_var = FormVariable.objects.filter(name=str(symbol), user=request.user).first()
                val = form_var.value
            substitutions.append((symbol, val))

        return sympy.simplify(expr.subs(substitutions))

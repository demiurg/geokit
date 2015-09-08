import sympy

from django.core.exceptions import ValidationError
from django.db import models


def validate_expression_text(expression_text):
    try:
        expr = sympy.sympify(expression_text, evaluate=False)
    except sympy.SympifyError:
        raise ValidationError('Not a valid expression.')

    for atom in expr.atoms():
        # For now only numbers can be used in expressions. Of course, this will
        # eventually also include symbols.
        if isinstance(atom, sympy.Symbol):
            if Expression.objects.filter(name=str(atom)).count() < 1:
                raise ValidationError('There is no expression with the name {0}'.format(str(atom)))
        elif not isinstance(atom, sympy.Number):
            raise ValidationError('Only numbers and other expressions may be used in expressions')


class Expression(models.Model):
    name = models.CharField(max_length=100)
    expression_text = models.TextField(validators=[validate_expression_text])

    def evaluate(self):
        expr = sympy.sympify(self.expression_text, evaluate=False)
        atoms = expr.atoms()
        # List of symbols that need to be resolved.
        symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

        # Currently symbols can only resolve to subexpressions.
        substitutions = []
        for symbol in symbols:
            subexp = Expression.objects.get(name=str(symbol))
            val = subexp.evaluate()
            substitutions.append((symbol, val))

        return sympy.simplify(expr.subs(substitutions))

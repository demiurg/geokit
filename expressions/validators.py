import sympy
from sympy.core.numbers import Number

from django.core.exceptions import ValidationError


def validate_expression_text(expression_text):
    try:
        expr = sympy.sympify(expression_text, evaluate=False)
    except sympy.SympifyError:
        raise ValidationError('Not a valid expression.')

    for atom in expr.atoms():
        # For now only numbers can be used in expressions. Of course, this will
        # eventually also include symbols.
        if not isinstance(atom, Number):
            raise ValidationError('Only numbers may be used in expressions')

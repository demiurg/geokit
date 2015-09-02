from django import forms

from expressions.models import Expression


class ExpressionForm(forms.ModelForm):
    class Meta:
        model = Expression
        fields = ['name', 'expression_text']

from django.db import models

from expressions.validators import validate_expression_text


class Expression(models.Model):
    name = models.CharField(max_length=100)
    expression_text = models.TextField(validators=[validate_expression_text])

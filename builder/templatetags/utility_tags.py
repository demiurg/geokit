from django import template

register = template.Library()


@register.filter
def keyvalue(dic, key):
    return dic[key]

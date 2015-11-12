-- Create expression return type, checking to make sure it does not exist.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expression_value') THEN
        CREATE TYPE expression_value AS
        (
            error boolean,
            result float
        );
    END IF;
END$$;

CREATE OR REPLACE FUNCTION evaluate_expression(expr_id integer, user_id integer, extra_subs json) RETURNS expression_value
AS $$
import json
import sympy

extra_substitutions = json.loads(extra_subs)

def expand_symbol(sym):
    symbol = str(sym)
    subexps = plpy.execute("SELECT * FROM expressions_expression WHERE name='%s'" % symbol)
    form_vars = plpy.execute("SELECT * FROM expressions_formvariable WHERE name='%s' AND user_id=%i" % (symbol, user_id))

    # Subexpression
    if len(subexps) > 0:
        val = evaluate_expression(subexps[0]["expression_text"])
    
    # Form variable
    elif len(form_vars) > 0:
        val = form_vars[0]["value"]

    elif symbol in extra_substitutions:
        val = extra_substitutions[symbol]

    else:
        return False

    return val

def evaluate_expression(expression_text):
    expression = sympy.sympify(expression_text, evaluate=False)
    atoms = expression.atoms()
    symbols = filter(lambda atom: type(atom) == sympy.Symbol, atoms)

    substitutions = []
    for symbol in symbols:
        expanded_symbol = expand_symbol(symbol)
        if expanded_symbol:
            substitutions.append((symbol, expanded_symbol))
        else:
            return {"error": True, "result": None}

    try:
        return {"error": False, "result": sympy.simplify(expression.subs(substitutions))}
    except sympy.SympifyError:
        return {"error": True, "result": None}

expression_text = plpy.execute("SELECT * FROM expressions_expression WHERE id=%i" % expr_id)[0]["expression_text"]
return evaluate_expression(expression_text)

$$ LANGUAGE plpythonu;

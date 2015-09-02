function(modal) {
    modal.respond('expressionChosen', {{ expression_json|safe }});
    modal.close();
}

function createExpression(id) {
    var chooserElement = $('#' + id + '-chooser');
    var expressionTitle = chooserElement.find('.title');
    var input = $('#' + id);

    $('.action-choose', chooserElement).click(function() {
        ModalWorkflow({
            url: window.chooserUrls.expressionChooser,
            responses: {
                expressionChosen: function(expData) {
                    input.val(expData.id);
                    expressionTitle.text(expData.title);
                    chooserElement.removeClass('blank');
                }
            }
        });
    });

    $('.action-clear', chooserElement).click(function() {
        input.val('');
        chooserElement.addClass('blank');
    });
}

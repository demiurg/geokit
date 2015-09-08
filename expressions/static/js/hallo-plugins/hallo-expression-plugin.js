(function() {
    (function($) {
        return $.widget('IKS.hallo-geokit-expressions', {
            options: {
                uuid: '',
                editable: null
            },
            populateToolbar: function(toolbar) {
                var button, widget;

                widget = this;
                button = $('<span></span>');
                button.hallobutton({
                    uuid: this.options.uuid,
                    editable: this.options.editable,
                    label: 'Expressions',
                    icon: 'icon-code',
                    command: null
                });
                toolbar.append(button);
                return button.on('click', function(event) {
                    var lastSelection;

                    lastSelection = widget.options.editable.getSelection();
                    return ModalWorkflow({
                        url: window.chooserUrls.expressionChooser,
                        responses: {
                            expressionChosen: function(expData) {
                                code = document.createElement('code');
                                code.setAttribute('data-id', expData.id);
                                code.setAttribute('data-embedtype', 'expression');
                                code.appendChild(document.createTextNode(expData.name));
                                lastSelection.insertNode(code);

                                return widget.options.editable.element.trigger('change');
                            }
                        }
                    });
                });
            }
        });
    })(jQuery);
}).call(this);

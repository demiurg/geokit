function(modal) {
    function ajaxifyLinks(context) {
        $('a.expression-choice', context).click(function() {
            modal.loadUrl(this.href);
            return false;
        });

        $('.pagination a', context).click(function() {
            var page = this.getAttribute('data-page');
            setPage(page);
            return false;
        });
    };

    function setPage(page) {
        if($('#id_q').val().length) {
            dataObj = {q: $('#id_q').val(), p: page};
        } else {
            dataObj = {p: page};
        }

        $.ajax({
            url: searchUrl,
            data: dataObj,
            success: function(data, status) {
                $('#search-results').html(data);
                ajaxifyLinks($('#search-results'));
            }
        });
        return false;
    };

    ajaxifyLinks(modal.body);

    $('form.expressions-upload', modal.body).submit(function() {
        var formdata = new FormData(this);

        $.ajax({
            url: this.action,
            data: formdata,
            processData: false,
            contentType: false,
            type: 'POST',
            dataType: 'text',
            success: function(response) {
                modal.loadResponseText(response);
            }
        });

        return false;
    });

    $('#id_q').on('input', function () {
        clearTimeout($.data(this, 'timer'));
        var wait = setTimeout(search, 50);
        $(this).data('timer', wait); 
    });

    {% url 'wagtail_tag_autocomplete' as autocomplete_url %}
    $('#id_tags', modal.body).tagit({
        autocomplete: {source: "{{ autocomplete_url|addslashes }}"}
    });
}

var Sieve = React.createClass({displayName: 'Sieve',
    render: function() {
        return (
            React.createElement('div', {className: "sieve"},
                'Hello, I am a sieve.'
            )
        );
    }
});

$(document).ready(function() {
    ReactDOM.render(
        React.createElement(Sieve, null),
        document.getElementById("sieve-container")
    );
});

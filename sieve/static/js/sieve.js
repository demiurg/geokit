var Sieve = React.createClass({
  displayName: 'Sieve',
  render: function() {
    return (
      <div>asdf {this.props.property}</div>
    );
  }
});

ReactDOM.render(
  <Sieve property="property" />,
  document.getElementById("sieve-container")
);

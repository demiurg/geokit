var Sieve = React.createClass({
  displayName: 'Sieve',
  render: function() {
    return (
      <div className="sieve">
        <MetaData title={this.props.title} description={this.props.description} />
      </div>
    );
  }
});

var MetaData = React.createClass({
  render: function() {
    return (
      <div className="sieve-metadata">
        <div className="sieve-metadata-title">
          <input type="text" placeholder="Title..." value={this.props.title} />
        </div>
        <div className="sieve-metadata-description">
          <textarea placeholder="Description...">{this.props.description}</textarea>
        </div>
      </div>
    );
  }
});

ReactDOM.render(
  <Sieve title={data.title} description={data.description} />,
  document.getElementById("sieve-container")
);

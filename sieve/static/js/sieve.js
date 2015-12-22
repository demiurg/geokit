var React = require('react');
var ReactDOM = require('react-dom');
var Table = require('react-legit-table');

var Sieve = React.createClass({
  displayName: 'Sieve',
  render: function() { 
    return (
      <div className="sieve">
        <MetaData title={this.props.title} description={this.props.description} />
        <div className="sieve-table-input">
          <Table rows={this.props.data} />
        </div>
        <SpatialConfigurator />
        <TemporalConfigurator />
        <div className="sieve-table-output">
          <Table rows={this.props.data} />
        </div>
      </div>
    );
  }
});

var MetaData = React.createClass({
  render: function() {
    return (
      <div className="sieve-metadata">
        <div className="sieve-metadata-title">
          <input type="text" placeholder="Title..." defaultValue={this.props.title} />
        </div>
        <div className="sieve-metadata-description">
          <textarea placeholder="Description..." defaultValue={this.props.description} />
        </div>
      </div>
    );
  }
});

var SpatialConfigurator = React.createClass({
  render: function() {
    return (
      <div className="sieve-spatial-configurator">
        <div id="map">This will be a map. Admins can refine the spatial domain here.</div>
      </div>
    );
  }
});

var TemporalConfigurator = React.createClass({
  render: function() {
    return (
      <div className="sieve-temporal-configurator">
        This will be a range slider with two controls, and start/end date text inputs.
      </div>
    );
  }
});

ReactDOM.render(
  <Sieve title={data.title} description={data.description} data={data.table_data} />,
  document.getElementById("sieve-container")
);

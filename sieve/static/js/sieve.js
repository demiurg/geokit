var Table = ReactBootstrap.Table;

class Sieve extends React.Component {
  render() {
    return (
      <div className="sieve">
        <MetaData title={this.props.title} description={this.props.description} />
        <div className="sieve-table-input">
          a table of input data is here
          <SieveTable cols={this.props.data.cols} rows={this.props.data.rows} />
        </div>
        <SpatialConfigurator />
        <TemporalConfigurator />
        <div className="sieve-table-output">
          a table of output data is here
          <SieveTable cols={this.props.data.cols} rows={this.props.data.rows} />
        </div>
      </div>
    );
  }
}

class MetaData extends React.Component {
  render() {
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
}

class SpatialConfigurator extends React.Component {
  render() {
    return (
      <div className="sieve-spatial-configurator">
        <div id="map">This will be a map. Admins can refine the spatial domain here.</div>
      </div>
    );
  }
}

class TemporalConfigurator extends React.Component {
  render() {
    return (
      <div className="sieve-temporal-configurator">
        This will be a range slider with two controls, and start/end date text inputs.
      </div>
    );
  }
}

class SieveTable extends React.Component {
  render() {
    return (
      <Table striped hover responsive>
        <TableHead cols={this.props.cols} />
        <TableBody rows={this.props.rows} />
      </Table>
    );
  }
}

class TableHead extends React.Component {
  render() {
    var cols = this.props.cols.map((column) => {
      return <th>{column}</th>;
    });
    return (
      <thead>
          <tr>{cols}</tr>
      </thead>
    );
  }
}

class TableBody extends React.Component {
  render() {
    var rows = this.props.rows.map((row) => {
      var data = row.map((data) => {
        return <td>{data}</td>;
      });
      return <tr>{data}</tr>
    });
    return <tbody>{rows}</tbody>;
  }
}

React.render(
  <Sieve title={metadata.title} description={metadata.description} data={data} />,
  document.getElementById("sieve-container")
);

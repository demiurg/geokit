var Table = ReactBootstrap.Table;
var Panel = ReactBootstrap.Panel;
var ButtonGroup = ReactBootstrap.ButtonGroup;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var Button = ReactBootstrap.Button;
var Row = ReactBootstrap.Row;
var Col = ReactBootstrap.Col;
var Input = ReactBootstrap.Input;
var OverlayTrigger = ReactBootstrap.OverlayTrigger;
var Tooltip = ReactBootstrap.Tooltip;
var Tabs = ReactBootstrap.Tabs;
var Tab = ReactBootstrap.Tab;
var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;

    var metadata = {
        title: "This is a Sieve title",
        description: "This is a Sieve description"
    }
    var data = {
      cols: [
        "Spatial Index",
        "Temporal Index",
        "Value"
      ],
      rows: [
        ["xxx", "yyy", "zzz"],
        ["xxx", "yyy", "zzz"],
        ["xxx", "yyy", "zzz"],
        ["xxx", "yyy", "zzz"],
        ["xxx", "yyy", "zzz"],
      ]
    }

class Sieve extends React.Component {
  renderDays(days) {
    var buttons = [];
    const tooltip = <Tooltip>5 Moments</Tooltip>;
    for (var i=1; i <= days; i++) {
      buttons.push(
        <Col xs={2} className="text-center">
          <OverlayTrigger
            trigger="hover"
            placement="top"
            overlay={tooltip}>
            <Button bsSize="xsmall" style={{width: "30px"}}>{i}</Button>
          </OverlayTrigger>
        </Col>
      );
    }
    return <div>{buttons}</div>;
  }
  render() {
    var output = {
      cols: [
        "Year",
        "January",
        "February",
        "March"
      ],
      rows: [
        [1995, this.renderDays(31), this.renderDays(28), this.renderDays(31)],
        [1996, this.renderDays(31), this.renderDays(28), this.renderDays(31)],
        [1997, this.renderDays(31), this.renderDays(28), this.renderDays(31)],
      ]
    }
    return (
      <div className="sieve">
        <Panel>
          <MetaData
            title={this.props.title}
            description={this.props.description} />
        </Panel>
        <Panel>
          <Row>
            <Col sm={4}>
              <TemporalConfigurator />
            </Col>
            <Col sm={8}>
              <SpatialConfigurator />
            </Col>
          </Row>
        </Panel>
        <Panel>
          <ButtonToolbar>
            <ButtonGroup>
              <Button>x</Button>
              <Button>/</Button>
              <Button>+</Button>
              <Button>-</Button>
            </ButtonGroup>
            <ButtonGroup className="pull-right">
              <DropdownButton title="Data Variables" id="data-var-dropdown">
                <MenuItem eventKey="1">Data Variable 1</MenuItem>
                <MenuItem eventKey="2">Data Variable 2</MenuItem>
              </DropdownButton>
              <DropdownButton title="Form Variables" id="form-var-dropdown">
                <MenuItem eventKey="1">Form Variable 1</MenuItem>
                <MenuItem eventKey="2">Form Variable 2</MenuItem>
              </DropdownButton>
              <DropdownButton title="User Variables" id="user-var-dropdown">
                <MenuItem eventKey="1">User Variable 1</MenuItem>
                <MenuItem eventKey="2">User Variable 2</MenuItem>
              </DropdownButton>
            </ButtonGroup>
          </ButtonToolbar>
          <Input type="textarea" style={{resize:"vertical"}} />
        </Panel>
        <Panel>
          <Filter />
        </Panel>
        <Panel>
          <Aggregate />
        </Panel>
      </div>
    );
  }
}

class MetaData extends React.Component {
  render() {
    return (
      <div className="sieve-metadata">
        <div className="sieve-metadata-title">
          <input
            type="text"
            placeholder="Title..."
            defaultValue={this.props.title} />
        </div>
        <div className="sieve-metadata-description">
          <textarea
            placeholder="Description..."
            defaultValue={this.props.description} />
        </div>
      </div>
    );
  }
}

class SpatialConfigurator extends React.Component {
  render() {
    return (
      <div className="sieve-spatial-configurator">
        <h3>Configure Temporal Domain</h3>
        <p>Similar to Map Select Widget. Allow admin to refine spatial domain for the variable</p>
      </div>
    );
  }
}

class SpatialViewer extends React.Component {
  render() {
    return (
      <div className="sieve-spatial-viewer">
        <h3>Spatial Domain Viewer</h3>
        <p>Similar to Map Viewer Widget. Allow admin to view spatial arbitrary domain.</p>
      </div>
    );
  }
}

class TemporalConfigurator extends React.Component {
  render() {
    return (
      <form className="form-horizontal">
        <h3>Configure Temporal Domain</h3>
        <h4>Start</h4>
        <Input type="select" label="Year" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting year">
          <option value="January">1986</option>
          <option value="January">1987</option>
          <option value="January">1988</option>
        </Input>
        <Input type="select" label="Month" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting month">
          <option value="January">January</option>
          <option value="January">February</option>
          <option value="January">March</option>
        </Input>
        <Input type="select" label="Day" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting day">
          <option value="January">1</option>
          <option value="January">2</option>
          <option value="January">3</option>
        </Input>
        <h4>End</h4>
        <Input type="select" label="Year" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting year">
          <option value="January">1986</option>
          <option value="January">1987</option>
          <option value="January">1988</option>
        </Input>
        <Input type="select" label="Month" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting month">
          <option value="January">January</option>
          <option value="January">February</option>
          <option value="January">March</option>
        </Input>
        <Input type="select" label="Day" labelClassName="col-sm-2" wrapperClassName="col-sm-10" placeholder="Starting day">
          <option value="January">1</option>
          <option value="January">2</option>
          <option value="January">3</option>
        </Input>
      </form>
    );
  }
}

class TemporalViewer extends React.Component {
  render() {
    return (
      <SieveTable
        cols={[
          "Year",
          "Month",
          "Day",
          "Time"
        ]}
        rows={[
          [1989, "January", 1, "14:35"],
          [1989, "February", 1, "14:35"],
          [1989, "March", 1, "14:35"],
          [1990, "January", 1, "14:35"],
          [1990, "February", 1, "14:35"],
          [1990, "March", 1, "14:35"],
          [1991, "January", 1, "14:35"],
          [1991, "February", 1, "14:35"],
          [1991, "March", 1, "14:35"],
        ]} />
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

class Filter extends React.Component {
  render() {
    return (
      <Row>
        <Col sm={8}>
          <SieveTable
            cols={[
              "Filters",
              ""
            ]}
            rows={[
              ["Exclude rows where value is greater than 50", <Button bsSize="xsmall" className="pull-right">x</Button>],
              ["Exclude rows where value is less than or equal to 6", <Button bsSize="xsmall" className="pull-right">x</Button>],
              ["Exclude rows where value is equal to 8", <Button bsSize="xsmall" className="pull-right">x</Button>]
            ]} />
        </Col>
        <Col sm={4}>
          <form>
            <Input type="select">
              <option value="January">Exclude rows where value is</option>
              <option value="January">Include rows where value is</option>
            </Input>
            <Input type="select">
              <option value="January">Less than</option>
              <option value="January">Less than or equal to</option>
              <option value="January">Equal to</option>
              <option value="January">Greater than</option>
              <option value="January">Greater than or equal to</option>
            </Input>
            <Input type="text" placeholder="x" />
            <Button className="pull-right">Add Filter</Button>
          </form>
        </Col>
      </Row>
    );
  }
}

class Aggregate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aggregateDimension: null,
      aggregateMethod: null
    };
  }
  aggregateDimensionToggle(dimension) {
    this.setState({aggregateDimension: dimension});
    if (dimension === null) {
      this.setState({aggregateMethod: null});
    }
  }
  aggregateMethodToggle(method) {
    this.setState({aggregateMethod: method});
  }
  render() {
    return (
      <ButtonToolbar>
        <ButtonGroup>
          <Button
            onClick={this.aggregateDimensionToggle.bind(this, "space")}
            active={this.state.aggregateDimension === "space" ? true : null}>
            Aggregate Across Space
          </Button>
          <Button
            onClick={this.aggregateDimensionToggle.bind(this, "time")}
            active={this.state.aggregateDimension === "time" ? true : null}>
            Aggregate Across Time
          </Button>
          <Button
            onClick={this.aggregateDimensionToggle.bind(this, null)}
            active={this.state.aggregateDimension === null ? true : null}>
            Do Not Aggregate
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "mean")}
            active={this.state.aggregateMethod === "mean" ? true : null}>
            Mean
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "median")}
            active={this.state.aggregateMethod === "median" ? true : null}>
            Median
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "mode")}
            active={this.state.aggregateMethod === "mode" ? true : null}>
            Mode
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "range")}
            active={this.state.aggregateMethod === "range" ? true : null}>
            Range
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "std")}
            active={this.state.aggregateMethod === "std" ? true : null}>
            Std. Dev.
          </Button>
        </ButtonGroup>
      </ButtonToolbar>
    );
  }
}



ReactDOM.render(
  <Sieve
    title={metadata.title}
    description={metadata.description}
    data={data} />,
  document.getElementById("sieve-container")
);

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

var spatial_domain = [
  ["x1", "y1"],
  ["x2", "y2"],
  ["x3", "y3"]
]

var temporal_domain = [
  new Date(1996, 0, 1),
  new Date(1997, 0, 1),
  new Date(1998, 0, 1),
  new Date(1999, 0, 1),
  new Date(2000, 0, 1)
]

var data = [
  {
    space: spatial_domain[0],
    time: temporal_domain[0],
    values: [
      {
        name: "precip",
        value: 5,
        unit: "inch"
      },
      {
        name: "temp",
        value: 6,
        unit: "celsius"
      }
    ]
  },
  {
    space: spatial_domain[1],
    time: temporal_domain[0],
    values: [
      {
        name: "precip",
        value: 10,
        unit: "inch"
      },
      {
        name: "temp",
        value: 8,
        unit: "celsius"
      }
    ]
  }
]

var filters = [
  
];

class DataVariableMenu extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    var values = this.props.data[0].values.map((value) => {
      return (<MenuItem>{value.name}</MenuItem>);
    });
    
    return (
      <DropdownButton title="Data Variables" id="data-var-dropdown">
        {values}
      </DropdownButton>
    );
  }
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
    return (
      <div className="sieve">
        <Panel>
          <MetaData
            {...this.props.metadata.title}
            {...this.props.metadata.description} />
        </Panel>
        <Panel>
          <Row>
            <Col sm={4}>
              <h3>Configure Start Date</h3>
              <TemporalConfigurator {...this.props}
                ref="dateStart" />
              <h3>Configure End Date</h3>
              <TemporalConfigurator {...this.props}
                ref="dateEnd" />
            </Col>
            <Col sm={8}>
              <SpatialConfigurator {...this.props} />
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
              <DataVariableMenu {...this.props} />
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
          <Input
            type="text"
            placeholder="Title..."
            defaultValue={this.props.title} />
        </div>
        <div className="sieve-metadata-description">
          <Input type="textarea"
            placeholder="Description..."
            defaultValue={this.props.description}
            style={{resize:"vertical"}} />
        </div>
      </div>
    );
  }
}

class SpatialConfigurator extends React.Component {
  render() {
    return (
      <div className="sieve-spatial-configurator">
        <h3>Configure Spatial Domain</h3>
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
  constructor(props) {
    super(props);
    this.state = {
      selectedMonth: this.props.temporalDomain[0].getMonth(),
      selectedDay: this.props.temporalDomain[0].getDate(),
      selectedYear: this.props.temporalDomain[0].getFullYear()
    };
  }

  setYear(event) {
    this.setState({selectedYear: parseInt(event.target.value)});
  }

  setMonth(event) {
    this.setState({selectedMonth: parseInt(event.target.value)});
  }

  setDay(event) {
    this.setState({selectedDay: parseInt(event.target.value)});
  }
  
  renderYears() {
    var optionsYears = this.props.temporalDomain.map((date) => {
      return (
        <option
          value={date.getFullYear()}>
          {date.getFullYear()}
        </option>
      );
    });
    
    return (
      <Input
        type="select"
        label="Year"
        labelClassname="col-sm-2"
        wrapperClassName="col-sm-10"
        onChange={this.setYear.bind(this)}
        defaultValue={this.props.temporalDomain[0].getFullYear()}>
        {optionsYears}
      </Input>
    );
  }
  
  renderMonths() {
    var optionsMonths = [];
    
    for (var i = 0; i < 12; i++) {
      optionsMonths.push(
        <option
          value={i}>
          {i + 1}
        </option>
      );
    }
    
    return (
      <Input
        type="select"
        label="Month"
        labelClassName="col-sm-2"
        wrapperClassName="col-sm-10"
        onChange={this.setMonth.bind(this)}
        defaultValue={this.props.temporalDomain[0].getMonth()}
        ref="selectedMonth">
        {optionsMonths}
      </Input>
    );
  }
  
  renderDays() {
    var monthsDays = [
      [1], // 28 day months
      [3, 5, 8, 10], // 30 day months
      [0, 2, 4, 6, 7, 9, 11] // 31 day months
    ];
    var days;
    
    if (monthsDays[0].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedDay > 28) {
        this.setState({selectedDay: 28});
      }
      days = 28;
    } else if (monthsDays[1].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedDay > 30) {
        this.setState({selectedDay: 30});
      }
      days = 30;
    } else if (monthsDays[2].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedday > 31) {
        this.setState({selectedDay: 31});
      }
      days = 31;
    }
    
    var optionsDays = [];
    for (var i = 1; i <= days; i++) {
      optionsDays.push(
        <option
          value={i}>
          {i}
        </option>
      );
    }
    
    return (
      <Input
        type="select"
        label="Day"
        labelClassName="col-sm-2"
        wrapperClassName="col-sm-10"
        onChange={this.setDay.bind(this)}
        defaultValue={this.props.temporalDomain[0].getDate()}
        ref="selectedDay">
        {optionsDays}
      </Input>
    )
  }

  render() {
    return (
      <form className="form-horizontal">
        {this.renderYears()}
        {this.renderMonths()}
        {this.renderDays()}
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
        {this.props.cols ? <TableHead cols={this.props.cols} /> : null}
        {this.props.rows.length > 0 ? <TableBody rows={this.props.rows} /> : null}
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
  constructor(props) {
    super(props);
    this.state = {
      filters: [],
      buttonDisabled: true
    };
  }
  
  validateFilter() {
    if (this.refs.action.refs.input.value == "" ||
      this.refs.comparison.refs.input.value == "" ||
      this.refs.benchmark.refs.input.value == "") {
      this.setState({buttonDisabled: true});
    } else {
      this.setState({buttonDisabled: null});
    }
  }
  
  addFilter() {
    var filters = this.state.filters.slice();
    filters.push([
      this.refs.action.refs.input.value,
      this.refs.comparison.refs.input.value,
      this.refs.benchmark.refs.input.value
    ]);
    this.setState({filters: filters});
  }
  
  render() {
    return (
      <Row>
        <Col sm={4}>
          <form onChange={this.validateFilter.bind(this)}>
            <Input ref="action" type="select">
              <option value="exclusive">Exclude rows where value is</option>
              <option value="inclusive">Include rows where value is</option>
            </Input>
            <Input ref="comparison" type="select">
              <option value="lt">Less than</option>
              <option value="ltet">Less than or equal to</option>
              <option value="et">Equal to</option>
              <option value="gt">Greater than</option>
              <option value="gtet">Greater than or equal to</option>
            </Input>
            <Input ref="benchmark" type="text" placeholder="x" />
            <Button
              className="pull-right"
              disabled={this.state.buttonDisabled}
              onClick={this.addFilter.bind(this)}>Add Filter</Button>
          </form>
        </Col>
        <Col sm={8}>
          <Panel>
            <SieveTable
              cols={[
                "Type of Filter",
                "Method of Comparison",
                "Value to Compare With"
              ]}
              rows={this.state.filters} />
          </Panel>
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
    if (this.state.aggregateDimension !== null) {
      this.setState({aggregateMethod: method});
    }
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
    metadata={metadata}
    spatialDomain={spatial_domain}
    temporalDomain={temporal_domain}
    data={data} />,
  document.getElementById("sieve-container")
);

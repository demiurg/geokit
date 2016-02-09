var Table = ReactBootstrap.Table;
var Panel = ReactBootstrap.Panel;
var ButtonGroup = ReactBootstrap.ButtonGroup;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var ButtonInput = ReactBootstrap.ButtonInput;
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

class DataVariableMenu extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    var values = this.props.data[0].values.map((value, index) => {
      return (
        <MenuItem
          key={index} >
          {value.name}
        </MenuItem>);
    });
    
    return (
      <DropdownButton title="Data Variables" id="data-var-dropdown">
        {values}
      </DropdownButton>
    );
  }
}


class Sieve extends React.Component {
  constructor(props) {
    super(props);

    this._onChange = this._onChange.bind(this);

    loadFormVariables();
    loadUserVariables();

    this.state = {
      title: "",
      description: "",
      expressionText: "",
      filters: [],
      spatialDomain: null,
      temporalDomain: null,
      aggregateDimension: null,
      aggregateMethod: null,

      formVariables: FormVariableStore.getState(),
      userVariables: UserVariableStore.getState()
    };
  }

  componentWillMount() {
    FormVariableStore.addChangeListener(this._onChange);
    UserVariableStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    FormVariableStore.removeChangeListener(this._onChange);
    UserVariableStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    this.setState({
      formVariables: FormVariableStore.getState(),
      userVariables: UserVariableStore.getState()
    });
  }

  renderDays(days) {
    var buttons = [];
    const tooltip = <Tooltip>5 Moments</Tooltip>;
    for (var i=1; i <= days; i++) {
      buttons.push(
        <Col xs={2} className="text-center" key={i}>
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

  updateMetadata(metadata) {
    this.setState({
      title: metadata.title,
      description: metadata.description
    });
  }

  _onExpressionTextChange(event) {
    this.updateExpressionText(event.target.value);
  }

  updateExpressionText(newText) {
    this.setState({expressionText: newText});
  }

  updateAggregateDimension(dimension) {
    this.setState({aggregateDimension: dimension});
  }

  updateAggregateMethod(method) {
    this.setState({aggregateMethod: method});
  }

  insertToken(token)  {
    var expressionEditor = ReactDOM.findDOMNode(this.refs.expressionEditor).getElementsByTagName("textarea")[0];
    var caretPos = expressionEditor.selectionStart;
    caretPos === 0 ? token = token + ' ' : token = ' ' + token + ' '; // Pad token
    var expressionText = $(expressionEditor).val();
    var newExpressionText = expressionText.substring(0, caretPos) + token + expressionText.substring(caretPos);
    $(expressionEditor).val(newExpressionText);
    this.updateExpressionText(newExpressionText);
  }

  saveExpression() {
    console.log(this.state);
  }
  
  render() {
    return (
      <div className="sieve">
        <Panel>
          <MetaData
            ref='metadata'
            updateMetadata={this.updateMetadata.bind(this)} />
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
              <Button onClick={this.insertToken.bind(this, '*')}>x</Button>
              <Button onClick={this.insertToken.bind(this, '/')}>/</Button>
              <Button onClick={this.insertToken.bind(this, '+')}>+</Button>
              <Button onClick={this.insertToken.bind(this, '-')}>-</Button>
            </ButtonGroup>
            <ButtonGroup className="pull-right">
              <DataVariableMenu {...this.props} />
              <DropdownButton title="Form Variables" id="form-var-dropdown">
                {this.state.formVariables.variables.map((formVar, i) => {
                  return <MenuItem key={i} eventKey={i} onClick={this.insertToken.bind(this, formVar.name)}>{formVar.name}</MenuItem>;
                })}
              </DropdownButton>
              <DropdownButton title="User Variables" id="user-var-dropdown">
                {this.state.userVariables.variables.map((userVar, i) => {
                  return <MenuItem key={i} eventKey={i} onClick={this.insertToken.bind(this, userVar.name)}>{userVar.name}</MenuItem>;
                })}
              </DropdownButton>
            </ButtonGroup>
          </ButtonToolbar>
          <Input type="textarea" style={{resize:"vertical"}} ref="expressionEditor" value={this.state.expressionText} onChange={this._onExpressionTextChange.bind(this)} />
          <Filter />
        </Panel>
        <Panel>
          <Aggregate
            updateAggregateDimension={this.updateAggregateDimension.bind(this)}
            updateAggregateMethod={this.updateAggregateMethod.bind(this)} />
        </Panel>
        <ButtonInput bsSize="large" onClick={this.saveExpression.bind(this)}>Save</ButtonInput>
      </div>
    );
  }
}

class MetaData extends React.Component {
  onChange() {
    this.props.updateMetadata({
      title: this.refs.titleInput.getValue(),
      description: this.refs.descriptionInput.getValue()
    });
  }

  render() {
    return (
      <div className="sieve-metadata">
        <div className="sieve-metadata-title">
          <Input
            ref='titleInput'
            type="text"
            placeholder="Title..."
            onChange={this.onChange.bind(this)} />
        </div>
        <div className="sieve-metadata-description">
          <Input type="textarea"
            ref="descriptionInput"
            placeholder="Description..."
            onChange={this.onChange.bind(this)}
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
          <Map lat="60.0" lon="10.0" zoom="10" />
      </div>
    );
  }
}

class SpatialViewer extends React.Component {
  render() {
    return (
      <div className="sieve-spatial-viewer">
        <Map lat="60.0" lon="10.0" zoom="10" />
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
    var optionsYears = this.props.temporalDomain.map((date, index) => {
      return (
        <option
          key={index}
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
          key={i}
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
          key={i}
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
      buttonDisabled: true,
      formDefaults: {
        action: 'exclusive',
        comparison: 'lt',
        benchmark: 'x'
      }
    };
  }
  
  validateFilter() {
    if (this.refs.action.refs.input.value == "" ||
      this.refs.comparison.refs.input.value == "" ||
      this.refs.benchmark.refs.input.value == "") {
      this.setState({buttonDisabled: true});
      return false;
    } else {
      for (var i = 0; i < this.state.filters.length; i++) {
        if (this.state.filters[i].key == this.refs.action.refs.input.value +
          this.refs.comparison.refs.input.value +
          this.refs.benchmark.refs.input.value) {
        
          this.setState({buttonDisabled: true});
          
          return false;
        }
      }
      this.setState({buttonDisabled: null});
      
      return true;
    }
  }
  
  addFilter() {
    if (this.validateFilter() == true) {
      var filters = this.state.filters.slice();
      filters.push({
        action: this.refs.action.refs.input.value,
        comparison: this.refs.comparison.refs.input.value,
        benchmark: this.refs.benchmark.refs.input.value,
        key: this.refs.action.refs.input.value +
          this.refs.comparison.refs.input.value +
          this.refs.benchmark.refs.input.value
      });
      this.setState({filters: filters});
      this.resetForm();
    } else if (this.validateFilter() == false) {
      console.log('getting here');
    }
  }
  
  removeFilter(filter) {
    var filters = this.state.filters;
    for (var i = 0; i < filters.length; i++) {
      if (this.state.filters[i].key == filter) {
        filters.splice(i, 1);
      }
    }
    this.setState({filters: filters});
  }
  
  resetForm() {
    this.refs.action.refs.input.value = "exclusive";
    this.refs.comparison.refs.input.value = "lt";
    this.refs.benchmark.refs.input.value = "";
    this.validateFilter();
  }
  
  render() {
    return (
      <Row>
        <Col sm={4}>
          <form>
            <Input ref="action" type="select" defaultValue="exclusive" onChange={this.validateFilter.bind(this)}>
              <option value="exclusive">Exclude rows where value is</option>
              <option value="inclusive">Include rows where value is</option>
            </Input>
            <Input ref="comparison" type="select" defaultValue="lt" onChange={this.validateFilter.bind(this)}>
              <option value="lt">Less than</option>
              <option value="ltet">Less than or equal to</option>
              <option value="et">Equal to</option>
              <option value="gt">Greater than</option>
              <option value="gtet">Greater than or equal to</option>
            </Input>
            <Input ref="benchmark" type="text" placeholder="x" onChange={this.validateFilter.bind(this)}/>
            <Button
              className="pull-right"
              disabled={this.state.buttonDisabled}
              onClick={this.addFilter.bind(this)}>Add Filter</Button>
          </form>
        </Col>
        <Col sm={8}>
          <Panel>
            <FilterList filters={this.state.filters} removeFilter={this.removeFilter.bind(this)} />
          </Panel>
        </Col>
      </Row>
    );
  }
}

class FilterList extends React.Component {
  render() {
    var filters = this.props.filters.map((filter) => {
      return (
        <FilterListItem filter={filter} removeFilter={this.props.removeFilter} />
      );
    });
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Type of Filter</th>
            <th>Method of Comparison</th>
            <th>Value for Comparison</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filters}
        </tbody>            
      </Table>
    );
  }
}

class FilterListItem extends React.Component {
  render() {
    return (
      <tr>
        <td>
          {this.props.filter.action}
        </td>
        <td>
          {this.props.filter.comparison}
        </td>
        <td>
          {this.props.filter.benchmark}
        </td>
        <td>
          <Button
            bsSize="xsmall"
            onClick={this.props.removeFilter.bind(null, this.props.filter.key)}>
            &nbsp;x&nbsp;
          </Button>
        </td>
      </tr>
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
    this.props.updateAggregateDimension(dimension);
  }
  aggregateMethodToggle(method) {
    if (this.state.aggregateDimension !== null) {
      this.setState({aggregateMethod: method});
    }
    this.props.updateAggregateMethod(method);
  }
  render() {
    return (
      <ButtonToolbar className="text-center">
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

var Map = React.createClass({
  createMap: function (element) {
    var map = L.map(element);
    L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    return map;
  },
  setupMap: function () {
    this.map.setView([this.props.lat, this.props.lon], this.props.zoom);
  },
  componentDidMount: function () {
    if (this.props.createMap) {
      this.map = this.props.createMap(ReactDOM.findDOMNode(this));
    } else {
      this.map = this.createMap(ReactDOM.findDOMNode(this));
    }
    this.setupMap();
  },
  render: function () {
    return (<div className="map"></div>);
  }
});

ReactDOM.render(
  <Sieve
    metadata={metadata}
    spatialDomain={spatial_domain}
    temporalDomain={temporal_domain}
    data={data} />,
  document.getElementById("sieve-container")
);

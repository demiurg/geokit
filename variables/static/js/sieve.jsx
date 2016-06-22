var Table = ReactBootstrap.Table;
var Panel = ReactBootstrap.Panel;
var ButtonGroup = ReactBootstrap.ButtonGroup;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var ButtonInput = ReactBootstrap.ButtonInput;
var Button = ReactBootstrap.Button;
var Row = ReactBootstrap.Row;
var Col = ReactBootstrap.Col;
var Alert = ReactBootstrap.Alert;
var Input = ReactBootstrap.Input;
var OverlayTrigger = ReactBootstrap.OverlayTrigger;
var Tooltip = ReactBootstrap.Tooltip;
var Tabs = ReactBootstrap.Tabs;
var Tab = ReactBootstrap.Tab;
var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;
var Modal = ReactBootstrap.Modal;

/* trying to be cute but not parsing:\
const {
  Table, Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col, Alert
  Input, OverlayTrigger, Tooltip, Tabs, Tab, DropdownButton, MenuItem
} = ReactBootstrap;
*/

/* Actions */

var REQUEST_LAYERS = 'REQUEST_LAYERS';
function requestLayers() {
  return {
    type: REQUEST_LAYERS
  }
}

var RECEIVE_LAYERS = 'RECEIVE_LAYERS';
function receiveLayers(json){
  return {
    type: RECEIVE_LAYERS,
    layers: json,
    receivedAt: Date.now()
  }
}

function fetchLayers(){
  return function(dispatch){
    dispatch(requestLayers());

    return $.ajax({
      url: '/api/layers',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveLayers(data));
      },
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

function layers(state={
  name: 'Layers',
  tovar: (name, field) => `layers__${name}__${field}`,
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
  switch (action.type) {
    case REQUEST_LAYERS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });
    case RECEIVE_LAYERS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.layers,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
}


var REQUEST_TABLES = 'REQUEST_TABLES';
function requestTables() {
  return {
    type: REQUEST_TABLES
  }
}

var RECEIVE_TABLES = 'RECEIVE_TABLES';
function receiveTables(json){
  return {
    type: RECEIVE_TABLES,
    tables: json,
    receivedAt: Date.now()
  }
}

function fetchTables(){
  return function(dispatch){
    dispatch(requestTables());

    return $.ajax({
      url: '/api/tables',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveTables(data));
      },
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

function tables(state={
  name: 'Tables',
  tovar: (name, field) => `tables__${name}__${field}`,
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
  switch (action.type) {
    case REQUEST_TABLES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });
    case RECEIVE_TABLES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.tables,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
}


var REQUEST_EXPRESSIONS = 'REQUEST_EXPRESSIONS';
function requestExpressions() {
  return {
    type: REQUEST_EXPRESSIONS
  }
}

var RECEIVE_EXPRESSIONS = 'RECEIVE_EXPRESSIONS';
function receiveExpressions(json){
  return {
    type: RECEIVE_EXPRESSIONS,
    expressions: json,
    receivedAt: Date.now()
  }
}

function fetchExpressions(){
  return function(dispatch){
    dispatch(requestExpressions());

    return $.ajax({
      url: '/api/expressions',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveExpressions(data));
      },
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

function expressions(state={
  name: 'Expressions',
  tovar: (name, field) => `expressions__${name}__${field}`,
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
  switch (action.type) {
    case REQUEST_EXPRESSIONS:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });
    case RECEIVE_EXPRESSIONS:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.expressions,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
}


var UPDATE_EXPRESSION_TEXT = 'UPDATE_EXPRESSION_TEXT';
function updateExpressionText(text) {
  return {
    type: UPDATE_EXPRESSION_TEXT,
    text
  };
}

var INSERT_TOKEN = 'INSERT_TOKEN';
function insertToken(token, position){
  return {
    type: INSERT_TOKEN,
    token,
    position
  };
}


function insertTokenInExpression(text, action){
  var pos = action.position;
  var token = action.token;

  if(pos === 0){
    token = token + ' '
  }else{
    token = ' ' + token + ' '; // Pad token
  }

  var newtext = text.substring(0, pos) + token + text.substring(pos);

  return newtext;
}

/* app */

var initialState = Object.assign({
  title: "",
  description: "",
  expressionText: "",
  filters: [],
  spatialDomain: null,
  temporalDomain: {start: null, end: null},
  aggregateDimension: "NA",
  aggregateMethod: null,

  errors: {},
  position: 0
}, sieve_props.initialData);


function sieveApp(state=initialState, action){
  switch (action.type){
    case REQUEST_LAYERS:
    case RECEIVE_LAYERS:
      return Object.assign({}, state, {
        layers: layers(state[action.layers], action)
      });
    case REQUEST_TABLES:
    case RECEIVE_TABLES:
      return Object.assign({}, state, {
        tables: tables(state[action.tables], action)
      });
    case REQUEST_EXPRESSIONS:
    case RECEIVE_EXPRESSIONS:
      return Object.assign({}, state, {
        expressions: expressions(state[action.expressions], action)
      });
    case UPDATE_EXPRESSION_TEXT:
      return Object.assign({}, state, {
        expressionText: action.text
      });
    case INSERT_TOKEN:
      return Object.assign({}, state, {
        expressionText: insertTokenInExpression(state.expressionText, action),
        position: action.position
      });
    default:
      return state;
  }
}

var mapStateToProps = (state) => {
  return Object.assign({}, state, {
    variables: [state.layers, state.expressions, state.tables],
    layers: state.layers,
    tables: state.tables
  });
};

var mapDispatchToProps = (dispatch) => {
  return {
    onExpressionTextChange: (text) => {
      dispatch(updateExpressionText(text));
    },
    onInsertToken: (token, position) => {
      dispatch(insertToken(token, position));
    }
  };
};

/* components */

var DropdownComponent = ({things, onclick}) => (
  // TODO something different when layers.isFetching

  <DropdownButton title={things.name} id="form-var-dropdown">
    {things.items.map((item, i) => item.field_names ?
      item.field_names.map((field, j) =>
        <MenuItem
          key={`${j}${i}`}
          eventKey={`${j}${i}`}
          onClick={() => onclick(things.tovar(item.name, field))}
          >
            {`${field}/${item.name}`}
        </MenuItem>
      ) : null
    )}
  </DropdownButton>
)


DropdownComponent.propTypes = {
  onclick: React.PropTypes.func.isRequired,
  things: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired
}

class VariableButtonGroup extends React.Component {
  /*static propTypes = {
    onclick: React.PropTypes.func.isRequired;
    variables: React.PropTypes.arrayOf(React.PropTypes.shape({
    name: React.PropTypes.number.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired).isRequired*/

  render(){
    var join = null;
    if (this.props.tables.items.length && this.props.layers.items.length){
      join = <JoinZard {...this.props} >Join</JoinZard>;
    }
    return <div className='pull-right'>
      {join}
      <ButtonGroup>
      {
        this.props.variables.map((things, i) =>
          <DropdownComponent
            things={things}
            onclick={(token) => {this.props.dispatch(insertToken(token))}}
            key={i}
          />
        )
      }
      </ButtonGroup>
    </div>;
  }
}


class JoinForm extends React.Component {
  render() {
    var {
      fields: {left, right, column},
      resetForm, handleSubmit, submitting
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" placeholder="Left variable" {...left} />
        </div>
      </form>
    );
  }
}

class JoinZard extends React.Component {
  constructor(props){
    super(props);
    this.state = { showModal: false};
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  use() {
    this.setState({ showModal: false });
  }

  render(){
    return (
      <div className='pull-right'>
        <Button
          bsStyle="primary"
          onClick={this.open.bind(this)}
        >
          Join
        </Button>

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Text in a modal</h4>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Use Variable</Button>
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}


class SieveComponent extends React.Component {
  constructor(props){
    super(props);

    // Keeping this synched separately
    this.state = {
      expressionText: this.props.expressionText
    };
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

  updateStartDate(date) {
    var dateJSON = date ? date.toJSON() : null;
    this.setState({temporalDomain: {start: dateJSON, end: this.state.temporalDomain.end}});
  }

  updateEndDate(date) {
    var dateJSON = date ? date.toJSON() : null;
    this.setState({temporalDomain: {start: this.state.temporalDomain.start, end: dateJSON}});
  }

  updateExpressionText(newText) {
    this.setState({expressionText: newText});
  }

  updateFilters(filters) {
    this.setState({filters: filters});
  }

  updateAggregateDimension(dimension) {
    this.setState({aggregateDimension: dimension});
  }

  updateAggregateMethod(method) {
    this.setState({aggregateMethod: method});
  }

  getPosition(){
    var el = ReactDOM.findDOMNode(this.refs.expressionEditor).getElementsByTagName("textarea")[0];
    var caretPos = el.selectionStart;
    return caretPos;
  }

  componentDidUpdate(props, state){
    if(props.position != this.props.position && this.props.position != 0){
      var el = ReactDOM.findDOMNode(this.refs.expressionEditor).getElementsByTagName("textarea")[0];
      el.setSelectionRange(this.props.position, this.props.position+1);
      console.log(this.props.position);
    }
  }

  validateExpression() {
    var errors = {},
        isValid = true,
        data = {
          name: this.state.title,
          description: this.state.description,
          expression_text: this.state.expressionText,
          temporal_domain: this.state.temporalDomain,
          spatial_domain_features: [],
          filters: this.state.filters,
          aggregate_method: this.state.aggregateMethod,
          aggregate_dimension: this.state.aggregateDimension
        };

    if (!data.name || data.name === '') {
      isValid = false;
      errors.name = "You must provide a title.";
    }

    if (!data.expression_text || data.expression_text === '') {
      isValid = false;
      errors.expression_text = "You must specify expression text."
    }

    return {isValid: isValid, errors: errors, data: data};
  }

  saveExpression() {
    var validationResponse = this.validateExpression();

    if (validationResponse.isValid) {
      var xhr = new XMLHttpRequest();

      if (this.props.initialData) {
        xhr.open("PUT", "/api/expressions/"+this.props.initialData.id+"/", true);
      } else {
        xhr.open("POST", "/api/expressions/", true);
      }

      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          if (200 <= xhr.status && xhr.status < 300) {
            window.location.href = window.redirect_after_save;
          } else {
            this.setState({errors: {server: xhr.response}});
          }
        }
      };

      xhr.send(JSON.stringify(validationResponse.data));
    } else {
      this.setState({errors: validationResponse.errors});
    }
  }

  render() {
    var self = this;
    var positionedInsert = (token) => {
      var pos = this.getPosition();
      console.log(pos);
      this.props.onInsertToken(token, pos);
    };

    return (
      <div className="sieve">
        {this.props.errors.server ? <Alert bsStyle="danger">{this.props.errors.server}</Alert> : null}
        <Panel>
          <MetaData
            ref='metadata'
            updateMetadata={this.updateMetadata.bind(this)}
            title={this.props.title} description={this.props.description} />
        </Panel>
        <Panel>
          <Row>
            <Col sm={4}>
              <h3>Configure Start Date</h3>
              <TemporalConfigurator
                date={this.props.temporalDomain.start}
                dateUpdated={this.updateStartDate.bind(this)}
                ref="dateStart" />
            </Col>
            <Col sm={4}>
              <h3>Configure End Date</h3>
              <TemporalConfigurator
                date={this.props.temporalDomain.end}
                dateUpdated={this.updateEndDate.bind(this)}
                ref="dateEnd" />
            </Col>
            <Col sm={4}>
              <h3>Interval Duration</h3>
              <IntervalConfigurator {...this.props} />
            </Col>
          </Row>
        </Panel>
        {/*<Panel>
          <Col>
            <SpatialConfigurator {...this.props} />
          </Col>
        </Panel>*/}
        <Panel>
          <ButtonToolbar>
            <ButtonGroup>
              <Button onClick={() => {positionedInsert('*')}}>x</Button>
              <Button onClick={() => {positionedInsert('/')}}>/</Button>
              <Button onClick={() => {positionedInsert('+')}}>+</Button>
              <Button onClick={() => {positionedInsert('-')}}>-</Button>
            </ButtonGroup>
            <VariableButtonGroup {...this.props} />
          </ButtonToolbar>
          <Input type="textarea"
            style={{resize: "vertical"}}
            ref="expressionEditor"
            value={this.props.expressionText}
            onChange={(e)=> this.props.onExpressionTextChange(e.target.value) }
          />
          <Filter filters={this.props.filters} updateFilters={this.updateFilters.bind(this)} />
        </Panel>
        <Panel>
          <Aggregate
            dimension={this.props.aggregateDimension}
            method={this.props.aggregateMethod}
            updateAggregateDimension={this.updateAggregateDimension.bind(this)}
            updateAggregateMethod={this.updateAggregateMethod.bind(this)} />
        </Panel>
        <ButtonInput bsSize="large" onClick={this.saveExpression.bind(this)}>Save</ButtonInput>
      </div>
    );
  }
}

var Sieve = ReactRedux.connect(
  mapStateToProps,
  mapDispatchToProps
)(SieveComponent);


class MetaData extends React.Component {
  onTitleChange(e) {
    this.props.updateMetadata({
      title: e.target.value,
      description: this.props.description
    });
  }

  onDescriptionChange(e) {
    this.props.updateMetadata({
      title: this.props.title,
      description: e.target.value
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
            value={this.props.title}
            onChange={this.onTitleChange.bind(this)} />
        </div>
        <div className="sieve-metadata-description">
          <Input type="textarea"
            ref="descriptionInput"
            placeholder="Description..."
            value={this.props.description}
            onChange={this.onDescriptionChange.bind(this)}
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

class IntervalConfigurator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedMeasure: null,
      selectedPeriod: null
    }
  }

  setMeasure(event) {
    this.setState({selectedMeasure: event.target.value});
    console.log(event.target.value);
  }

  setPeriod(event) {
    this.setState({selectedPeriod: event.target.value});
    console.log(event.target.value);
  }

  render() {
    var optionsPeriods = [];
    var periods = ['day', 'week', 'month', 'year'];

    for (var i = 0; i < periods.length; i++) {
      optionsPeriods.push(
        <option
          key={i}
          value={periods[i]}>
            {periods[i]}
        </option>
      );
    }

    var optionsMeasures = [];

    for (var i = 0; i < 31; i++) {
      optionsMeasures.push(
        <option
          key={i}
          value={i + 1}>
            {i + 1}
        </option>
      );
    }

    return (
      <form className="form-horizontal">
        <Input
          type="select"
          label="Measure"
          labelClassName="sr-only"
          onChange={this.setPeriod.bind(this)}
          wrapperClassName="col-sm-12"
          defaultValue={-1}>
          <option value={-1}>Measure</option>
            {optionsMeasures}
        </Input>
        <Input
          type="select"
          label="Period"
          labelClassName="sr-only"
          onChange={this.setPeriod.bind(this)}
          wrapperClassName="col-sm-12"
          defaultValue={-1}>
          <option value={-1}>Period</option>
          {optionsPeriods}
        </Input>
      </form>
    );
  }
}

class TemporalConfigurator extends React.Component {
  constructor(props) {
    super(props);

    if (this.props.date) {
      this.state = {
        selectedMonth: this.props.date.getMonth(),
        selectedDay: this.props.date.getDate(),
        selectedYear: this.props.date.getFullYear()
      };
    } else {
      this.state = {
        selectedMonth: null,
        selectedDay: null,
        selectedYear: null,
      };
    }
  }

  setYear(event) {
    var yearStr = event.target.value,
        year = yearStr == '-1' ? null : parseInt(yearStr);

    this.setState({selectedYear: year}, () => {
      this.props.dateUpdated(this.currentDate());
    });
  }

  setMonth(event) {
    var monthStr = event.target.value,
        month = monthStr == '-1' ? null : parseInt(monthStr);

    this.setState({selectedMonth: month}, () => {
      this.props.dateUpdated(this.currentDate());
    });
  }

  setDay(event) {
    var dayStr = event.target.value,
        day = dayStr == '-1' ? null : parseInt(dayStr);

    this.setState({selectedDay: day}, () => {
      this.props.dateUpdated(this.currentDate());
    });
  }

  currentDate() {
    if (this.state.selectedMonth == null || this.state.selectedDay == null || this.state.selectedYear == null) {
      return null;
    }

    return new Date(+this.state.selectedYear, +this.state.selectedMonth, +this.state.selectedDay);
  }

  renderYears() {
    var optionsYears = [1996, 1997, 1998, 1999, 2000].map((year, index) => {
      return (
        <option
          key={index}
          value={year}>
          {year}
        </option>
      );
    });

    return (
      <Input
        type="select"
        label="Year"
        labelClassName="sr-only"
        wrapperClassName="col-sm-12"
        onChange={this.setYear.bind(this)}
        defaultValue={this.state.selectedYear}>
        <option value={-1}>Year</option>
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
        labelClassName="sr-only"
        wrapperClassName="col-sm-12"
        onChange={this.setMonth.bind(this)}
        defaultValue={this.state.selectedMonth}
        ref="selectedMonth">
        <option value={-1}>Month</option>
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
        labelClassName="sr-only"
        wrapperClassName="col-sm-12"
        onChange={this.setDay.bind(this)}
        defaultValue={this.state.selectedDay}
        ref="selectedDay">
        <option value={-1}>Day</option>
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
      buttonDisabled: true,
      action: 'exclusive',
      comparate: 'value',
      comparison: 'lt',
      benchmark: null
    };
  }

  validateFilter() {
    for (var i = 0; i < this.props.filters.length; i++) {
      if (this.props.filters[i].key == this.state.action +
                                       this.state.comparate +
                                       this.state.comparison +
                                       this.renderBenchmark()) {
        this.setState({buttonDisabled: true, benchmark: null});

        return false;
      }
    }
    this.setState({buttonDisabled: null});

    return true;
  }

  addFilter() {
    if (this.validateFilter() == true) {
      var filters = this.props.filters.slice();
      filters.push({
        action: this.state.action,
        comparison: this.state.comparison,
        comparate: this.state.comparate,
        benchmark: this.state.benchmark,
        key: this.state.action +
          this.state.comparate +
          this.state.comparison +
          this.renderBenchmark()
      });
      this.props.updateFilters(filters);
      this.resetForm();
    } else if (this.validateFilter() == false) {
      console.log('getting here');
    }
  }

  removeFilter(filter) {
    var filters = this.props.filters;
    for (var i = 0; i < filters.length; i++) {
      if (this.props.filters[i].key == filter) {
        filters.splice(i, 1);
      }
    }
    this.props.updateFilters(filters);
  }

  resetForm() {
    this.setState({
      buttonDisabled: true,
      action: 'exclusive',
      comparate: 'value',
      comparison: 'lt',
      benchmark: null
    });
  }

  updateAction(e) {
    this.setState({action: e.target.value});
  }

  updateComparate(e) {
    this.setState({
      buttonDisabled: true,
      comparate: e.target.value,
      benchmark: null
    });
  }

  updateComparison(e) {
    this.setState({comparison: e.target.value});
  }

  updateBenchmark(e) {
    var buttonDisabled = true;
    if (e.target.value) {
      buttonDisabled = false;
    }
    this.setState({
      buttonDisabled: buttonDisabled,
      benchmark: e.target.value
    });
  }

  renderBenchmark() {
    if (this.state.benchmark.hasOwnProperty('month') && this.state.benchmark.hasOwnProperty('day')) {
      return this.state.benchmark.month + "-" + this.state.benchmark.day;
    }
    return this.state.benchmark;
  }

  updateDay(e) {
    var benchmark = this.state.benchmark,
        buttonDisabled = true;

    if (!benchmark) {
      benchmark = {month: null, day: null};
    }

    benchmark[e.target.id] = e.target.value;

    if (benchmark.month && benchmark.day) {
      buttonDisabled = false;
    }

    this.setState({buttonDisabled: buttonDisabled, benchmark: benchmark});
  }

  render() {
    return (
      <Row>
        <Col sm={4}>
          <form>
            <Input value={this.state.action} type="select" onChange={this.updateAction.bind(this)}>
              <option value="exclusive">Exclude rows where</option>
              <option value="inclusive">Include rows where</option>
            </Input>
            <Input value={this.state.comparate} type="select" onChange={this.updateComparate.bind(this)}>
              <option value="value">value is</option>
              <option value="day">day is</option>
            </Input>
            <Input value={this.state.comparison} type="select" onChange={this.updateComparison.bind(this)}>
              <option value="lt">Less than</option>
              <option value="ltet">Less than or equal to</option>
              <option value="et">Equal to</option>
              <option value="gt">Greater than</option>
              <option value="gtet">Greater than or equal to</option>
            </Input>
            {this.state.comparate == 'value' ?
              <Input value={this.state.benchmark} type="text" placeholder="x" onChange={this.updateBenchmark.bind(this)}/> :
              <Row onChange={this.updateDay.bind(this)}>
                <Col xs={6}><Input id="month" type="text" placeholder="Month" /></Col>
                <Col xs={6}><Input id="day" type="text" placeholder="Day" /></Col>
              </Row>}
            <Button
              className="pull-right"
              disabled={this.state.buttonDisabled}
              onClick={this.addFilter.bind(this)}>Add Filter</Button>
          </form>
        </Col>
        <Col sm={8}>
          <Panel>
            <FilterList filters={this.props.filters} removeFilter={this.removeFilter.bind(this)} />
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
        <FilterListItem key={filter.key} filter={filter} removeFilter={this.props.removeFilter} />
      );
    });
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Type of Filter</th>
            <th>Value Compared</th>
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
          {this.props.filter.comparate}
        </td>
        <td>
          {this.props.filter.comparison}
        </td>
        <td>
          {typeof this.props.filter.benchmark == "object" ?
            this.props.filter.benchmark.month + "-" + this.props.filter.benchmark.day :
            this.props.filter.benchmark}
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
      aggregateDimension: this.props.dimension,
      aggregateMethod: this.props.method
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
            onClick={this.aggregateDimensionToggle.bind(this, "SP")}
            active={this.state.aggregateDimension === "SP" ? true : null}>
            Aggregate Across Space
          </Button>
          <Button
            onClick={this.aggregateDimensionToggle.bind(this, "TM")}
            active={this.state.aggregateDimension === "TM" ? true : null}>
            Aggregate Across Time
          </Button>
          <Button
            onClick={this.aggregateDimensionToggle.bind(this, 'NA')}
            active={this.state.aggregateDimension === 'NA' ? true : null}>
            Do Not Aggregate
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "MEA")}
            active={this.state.aggregateMethod === "MEA" ? true : null}>
            Mean
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "MED")}
            active={this.state.aggregateMethod === "MED" ? true : null}>
            Median
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "MOD")}
            active={this.state.aggregateMethod === "MOD" ? true : null}>
            Mode
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "RAN")}
            active={this.state.aggregateMethod === "RAN" ? true : null}>
            Range
          </Button>
          <Button
            onClick={this.aggregateMethodToggle.bind(this, "STD")}
            active={this.state.aggregateMethod === "STD" ? true : null}>
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
      this.map = this.props.createMap(this.refs_map);
    } else {
      this.map = this.createMap(this.refs_map);
    }
    this.setupMap();
  },
  render: function () {
    return (<div ref={(ref) => this.refs_map = ref} className="map"></div>);
  }
});

function sieve(el){
    var store = Redux.createStore(
    sieveApp,
    Redux.applyMiddleware(ReduxThunk.default)
  );

  store.dispatch(fetchLayers());
  store.dispatch(fetchTables());
  store.dispatch(fetchExpressions());

  ReactDOM.render(
    React.createElement(
      ReactRedux.Provider,
      {
        children: React.createElement(Sieve, sieve_props),
        store: store
      }
    ),
    el
  );
}

// Since this script is pulled in as 'text/babel', other scripts will go ahead and run
// even if this one isn't finished. This provides a reliable way to know when it has
// finished and to access its exports.
var sieve_defined = new CustomEvent(
  'sievedefined',
  {
    detail: { sieve }
  }
);
document.dispatchEvent(sieve_defined);

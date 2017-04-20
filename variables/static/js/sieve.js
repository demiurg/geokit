'use strict';

var REQUEST_LAYERS = 'REQUEST_LAYERS';
var RECEIVE_LAYERS = 'RECEIVE_LAYERS';

var REQUEST_TABLES = 'REQUEST_TABLES';
var RECEIVE_TABLES = 'RECEIVE_TABLES';

var RECEIVE_RASTER_CATALOG = 'RECEIVE_RASTE_CATALOG';

var RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
var REQUEST_VARIABLES = 'REQUEST_VARIABLES';

var UPDATE_NAME = 'UPDATE_NAME';
var UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
var UPDATE_SPATIAL_DOMAIN = 'UPDATE_SPATIAL_DOMAIN';
var UPDATE_TREE = 'UPDATE_TREE';
var UPDATE_ERRORS = 'UPDATE_ERRORS';
var UPDATE_MODIFIED = 'UPDATE_MODIFIED';
var UPDATE_CREATED = 'UPDATE_CREATED';

var REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
var ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';
var EDIT_INPUT_VARIABLE = 'EDIT_INPUT_VARIABLE';
var ERROR_INPUT_VARIABLE = 'ERROR_INPUT_VARIABLE';

var INIT_TREE = 'INIT_TREE';
var EDIT_TREE_NODE = 'EDIT_TREE_NODE';

var CHANGE_OPERAND_SELECTION = 'CHANGE_OPERAND_SELECTION';

var SAVE_VARIABLE = 'SAVE_VARIABLE';
var POST_VARIABLE = 'POST_VARIABLE';
var RECIEVE_VARIABLE = 'RECIEVE_VARIABLE';

var CHANGE_INTERFACE_STATE = 'CHANGE_INTERFACE_STATE';

var EDIT_TABULAR_DATA = 'EDIT_TABULAR_DATA';
var EDIT_RASTER_DATA = 'EDIT_RASTER_DATA';
var EDIT_EXPRESSION_DATA = 'EDIT_EXPRESSION_DATA';

function requestLayers() {
  return {
    type: REQUEST_LAYERS
  };
}

function receiveLayers(json) {
  return {
    type: RECEIVE_LAYERS,
    layers: json,
    receivedAt: Date.now()
  };
}

function receiveRasterCatalog(json) {
  return {
    type: RECEIVE_RASTER_CATALOG,
    raster_catalog: json,
    receivedAt: Date.now()
  };
}

function fetchLayers() {
  return function (dispatch) {
    dispatch(requestLayers());

    return $.ajax({
      url: '/api/layers?status=0',
      dataType: 'json',
      cache: 'false',
      success: function success(data) {
        dispatch(receiveLayers(data));
      },
      error: function error(xhr, status, err) {
        console.error(xhr.url, status, err.toString());
      }
    });
  };
}

function requestTables() {
  return {
    type: REQUEST_TABLES
  };
}

function receiveTables(json) {
  return {
    type: RECEIVE_TABLES,
    tables: json,
    receivedAt: Date.now()
  };
}

function fetchTables() {
  return function (dispatch) {
    dispatch(requestTables());

    return $.ajax({
      url: '/api/tables?status=0',
      dataType: 'json',
      cache: 'false',
      success: function success(data) {
        dispatch(receiveTables(data));
      },
      error: function error(xhr, status, err) {
        console.error(xhr.url, status, err.toString());
      }
    });
  };
}

function requestVariables() {
  return {
    type: REQUEST_VARIABLES
  };
}

function receiveVariables(json) {
  return {
    type: RECEIVE_VARIABLES,
    variables: json,
    receivedAt: Date.now()
  };
}

function fetchVariables() {
  return function (dispatch) {
    dispatch(requestVariables());

    return $.ajax({
      url: '/api/variables',
      dataType: 'json',
      cache: 'false',
      success: function success(data) {
        dispatch(receiveVariables(data));
      },
      error: function error(xhr, status, err) {
        console.error(xhr.url, status, err.toString());
      }
    });
  };
}

var nextVariableId = 0;

function validateRaster(raster) {
  var range = raster[1][2];

  if (range.includes("undefined")) return "Start and end date must be specified.";
  if (!range.match(/\d{4}-\d{3},\d{4}-\d{3}/g)) return "Date must be entered in the form yyyy-ddd.";

  return null;
}

function addInputVariable(variable) {
  var node = variable.node;
  var inputType = node[0];
  var error = null;

  if (inputType == 'raster') {
    error = validateRaster(node);
  }
  if (error) {
    return {
      type: ERROR_INPUT_VARIABLE,
      error: error,
      field: "rasterDataTemporalRange",
      variable: variable
    };
  } else {
    return {
      type: ADD_INPUT_VARIABLE,
      error: error,
      field: "rasterDataTemporalRange",
      id: nextVariableId++,
      variable: variable
    };
  }
}

function editInputVariable(variable, idx) {
  return {
    type: EDIT_INPUT_VARIABLE,
    index: idx,
    variable: variable
  };
}

function removeInputVariable(idx) {
  return {
    type: REMOVE_INPUT_VARIABLE,
    index: idx
  };
}

function initTree(node) {
  return {
    type: INIT_TREE,
    node: node
  };
}

function editTreeNode(id, node) {
  return {
    type: EDIT_TREE_NODE,
    id: id,
    node: node
  };
}

function changeOperandSelection(id, value) {
  return {
    type: CHANGE_OPERAND_SELECTION,
    id: id,
    value: value
  };
}

function updateName(name, field) {
  var error = null;
  if (!name || !name.match(/^[a-zA-Z0-9-]+$/)) {
    error = "Name is not alphanumeric or contains spaces.";
  }
  return {
    type: UPDATE_NAME,
    name: name,
    field: field,
    error: error
  };
}

function updateDescription(description) {
  return {
    type: UPDATE_DESCRIPTION,
    description: description
  };
}

function updateSpatialDomain(layer_id) {
  return {
    type: UPDATE_SPATIAL_DOMAIN,
    layer_id: layer_id
  };
}

function postVariable() {
  return {
    type: POST_VARIABLE
  };
}

function recieveVariable(json) {
  return {
    type: RECIEVE_VARIABLE,
    variable: json,
    receivedAt: Date.now()
  };
}

function updateErrors() {
  var errors = arguments.length <= 0 || arguments[0] === undefined ? { "name": null, "tree": null } : arguments[0];

  return {
    type: UPDATE_ERRORS,
    errors: errors
  };
}

function updateModified() {
  var time = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

  return {
    type: UPDATE_MODIFIED,
    time: time
  };
}

function updateCreated() {
  var time = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

  return {
    type: UPDATE_CREATED,
    time: time
  };
}

function saveVariable(variable, created) {
  return function (dispatch) {
    dispatch(postVariable());

    return $.ajax({
      url: '/api/variables/' + (created ? variable.id + '/' : ''),
      dataType: 'json',
      cache: 'false',
      data: JSON.stringify(variable),
      method: created ? 'PATCH' : 'POST',
      contentType: "application/json",
      processData: false,
      success: function success(data) {
        if (!created) {
          dispatch(updateCreated(data.created));
        } else {
          dispatch(updateModified(data.modified));
        }
        dispatch(updateErrors());
      },
      error: function error(xhr, status, err) {
        var server_errors = xhr.responseJSON;
        var errors = {};
        if (server_errors) {
          var keys = Object.keys(server_errors);
          for (var i = 0; i < keys.length; i++) {
            var error = '';
            if (Array.isArray(server_errors[keys[i]])) {
              error = server_errors[keys[i]].join(' ');
            } else {
              error = server_errors[keys[i]];
            }
            errors[keys[i]] = error;
          }
        } else {
          errors['detail'] = err;
        }
        dispatch(updateErrors(errors));
      }
    });
  };
}

function changeInterfaceState(newState) {
  return {
    type: CHANGE_INTERFACE_STATE,
    state: newState
  };
}

function editTabularData(data) {
  return {
    type: EDIT_TABULAR_DATA,
    data: data
  };
}

function editRasterData(data) {
  return {
    type: EDIT_RASTER_DATA,
    data: data
  };
}

function editExpressionData(data) {
  return {
    type: EDIT_EXPRESSION_DATA,
    data: data
  };
}
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MetaData = function (_React$Component) {
  _inherits(MetaData, _React$Component);

  function MetaData() {
    _classCallCheck(this, MetaData);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  MetaData.prototype.onTitleChange = function onTitleChange(e) {
    this.props.updateMetadata({
      title: e.target.value,
      description: this.props.description
    });
  };

  MetaData.prototype.onDescriptionChange = function onDescriptionChange(e) {
    this.props.updateMetadata({
      title: this.props.title,
      description: e.target.value
    });
  };

  MetaData.prototype.render = function render() {
    return React.createElement(
      "div",
      { className: "sieve-metadata" },
      React.createElement(
        "div",
        { className: "sieve-metadata-title" },
        React.createElement(Input, {
          ref: "titleInput",
          type: "text",
          placeholder: "Title...",
          value: this.props.title,
          onChange: this.onTitleChange.bind(this),
          validationState: this.props.errors && this.props.errors.title ? this.props.errors.title : null
        })
      ),
      React.createElement(
        "div",
        { className: "sieve-metadata-description" },
        React.createElement(Input, { type: "textarea",
          ref: "descriptionInput",
          placeholder: "Description...",
          value: this.props.description,
          onChange: this.onDescriptionChange.bind(this),
          style: { resize: "vertical" } })
      )
    );
  };

  return MetaData;
}(React.Component);

var SpatialConfigurator = function (_React$Component2) {
  _inherits(SpatialConfigurator, _React$Component2);

  function SpatialConfigurator() {
    _classCallCheck(this, SpatialConfigurator);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  SpatialConfigurator.prototype.render = function render() {
    return React.createElement(
      "div",
      { className: "sieve-spatial-configurator" },
      React.createElement(Map, { lat: "60.0", lon: "10.0", zoom: "10" })
    );
  };

  return SpatialConfigurator;
}(React.Component);

var SpatialViewer = function (_React$Component3) {
  _inherits(SpatialViewer, _React$Component3);

  function SpatialViewer() {
    _classCallCheck(this, SpatialViewer);

    return _possibleConstructorReturn(this, _React$Component3.apply(this, arguments));
  }

  SpatialViewer.prototype.render = function render() {
    return React.createElement(
      "div",
      { className: "sieve-spatial-viewer" },
      React.createElement(Map, { lat: "60.0", lon: "10.0", zoom: "10" })
    );
  };

  return SpatialViewer;
}(React.Component);

var IntervalConfigurator = function (_React$Component4) {
  _inherits(IntervalConfigurator, _React$Component4);

  function IntervalConfigurator(props) {
    _classCallCheck(this, IntervalConfigurator);

    var _this4 = _possibleConstructorReturn(this, _React$Component4.call(this, props));

    _this4.state = {
      selectedMeasure: null,
      selectedPeriod: null
    };
    return _this4;
  }

  IntervalConfigurator.prototype.setMeasure = function setMeasure(event) {
    this.setState({ selectedMeasure: event.target.value });
    console.log(event.target.value);
  };

  IntervalConfigurator.prototype.setPeriod = function setPeriod(event) {
    this.setState({ selectedPeriod: event.target.value });
    console.log(event.target.value);
  };

  IntervalConfigurator.prototype.render = function render() {
    var optionsPeriods = [];
    var periods = ['day', 'week', 'month', 'year'];

    for (var i = 0; i < periods.length; i++) {
      optionsPeriods.push(React.createElement(
        "option",
        {
          key: i,
          value: periods[i] },
        periods[i]
      ));
    }

    var optionsMeasures = [];

    for (var i = 0; i < 31; i++) {
      optionsMeasures.push(React.createElement(
        "option",
        {
          key: i,
          value: i + 1 },
        i + 1
      ));
    }

    return React.createElement(
      "form",
      { className: "form-horizontal" },
      React.createElement(
        Input,
        {
          type: "select",
          label: "Measure",
          labelClassName: "sr-only",
          onChange: this.setPeriod.bind(this),
          wrapperClassName: "col-sm-12",
          defaultValue: -1 },
        React.createElement(
          "option",
          { value: -1 },
          "Measure"
        ),
        optionsMeasures
      ),
      React.createElement(
        Input,
        {
          type: "select",
          label: "Period",
          labelClassName: "sr-only",
          onChange: this.setPeriod.bind(this),
          wrapperClassName: "col-sm-12",
          defaultValue: -1 },
        React.createElement(
          "option",
          { value: -1 },
          "Period"
        ),
        optionsPeriods
      )
    );
  };

  return IntervalConfigurator;
}(React.Component);

var TemporalConfigurator = function (_React$Component5) {
  _inherits(TemporalConfigurator, _React$Component5);

  function TemporalConfigurator(props) {
    _classCallCheck(this, TemporalConfigurator);

    var _this5 = _possibleConstructorReturn(this, _React$Component5.call(this, props));

    if (_this5.props.date) {
      _this5.state = {
        selectedMonth: _this5.props.date.getMonth(),
        selectedDay: _this5.props.date.getDate(),
        selectedYear: _this5.props.date.getFullYear()
      };
    } else {
      _this5.state = {
        selectedMonth: null,
        selectedDay: null,
        selectedYear: null
      };
    }
    return _this5;
  }

  TemporalConfigurator.prototype.setYear = function setYear(event) {
    var _this6 = this;

    var yearStr = event.target.value,
        year = yearStr == '-1' ? null : parseInt(yearStr);

    this.setState({ selectedYear: year }, function () {
      _this6.props.dateUpdated(_this6.currentDate());
    });
  };

  TemporalConfigurator.prototype.setMonth = function setMonth(event) {
    var _this7 = this;

    var monthStr = event.target.value,
        month = monthStr == '-1' ? null : parseInt(monthStr);

    this.setState({ selectedMonth: month }, function () {
      _this7.props.dateUpdated(_this7.currentDate());
    });
  };

  TemporalConfigurator.prototype.setDay = function setDay(event) {
    var _this8 = this;

    var dayStr = event.target.value,
        day = dayStr == '-1' ? null : parseInt(dayStr);

    this.setState({ selectedDay: day }, function () {
      _this8.props.dateUpdated(_this8.currentDate());
    });
  };

  TemporalConfigurator.prototype.currentDate = function currentDate() {
    if (this.state.selectedMonth == null || this.state.selectedDay == null || this.state.selectedYear == null) {
      return null;
    }

    return new Date(+this.state.selectedYear, +this.state.selectedMonth, +this.state.selectedDay);
  };

  TemporalConfigurator.prototype.renderYears = function renderYears() {
    var optionsYears = [1996, 1997, 1998, 1999, 2000].map(function (year, index) {
      return React.createElement(
        "option",
        {
          key: index,
          value: year },
        year
      );
    });

    return React.createElement(
      Input,
      {
        type: "select",
        label: "Year",
        labelClassName: "sr-only",
        wrapperClassName: "col-sm-12",
        onChange: this.setYear.bind(this),
        defaultValue: this.state.selectedYear },
      React.createElement(
        "option",
        { value: -1 },
        "Year"
      ),
      optionsYears
    );
  };

  TemporalConfigurator.prototype.renderMonths = function renderMonths() {
    var optionsMonths = [];

    for (var i = 0; i < 12; i++) {
      optionsMonths.push(React.createElement(
        "option",
        {
          key: i,
          value: i },
        i + 1
      ));
    }

    return React.createElement(
      Input,
      {
        type: "select",
        label: "Month",
        labelClassName: "sr-only",
        wrapperClassName: "col-sm-12",
        onChange: this.setMonth.bind(this),
        defaultValue: this.state.selectedMonth,
        ref: "selectedMonth" },
      React.createElement(
        "option",
        { value: -1 },
        "Month"
      ),
      optionsMonths
    );
  };

  TemporalConfigurator.prototype.renderDays = function renderDays() {
    var monthsDays = [[1], // 28 day months
    [3, 5, 8, 10], // 30 day months
    [0, 2, 4, 6, 7, 9, 11] // 31 day months
    ];
    var days;

    if (monthsDays[0].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedDay > 28) {
        this.setState({ selectedDay: 28 });
      }
      days = 28;
    } else if (monthsDays[1].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedDay > 30) {
        this.setState({ selectedDay: 30 });
      }
      days = 30;
    } else if (monthsDays[2].indexOf(this.state.selectedMonth) !== -1) {
      if (this.state.selectedday > 31) {
        this.setState({ selectedDay: 31 });
      }
      days = 31;
    }

    var optionsDays = [];
    for (var i = 1; i <= days; i++) {
      optionsDays.push(React.createElement(
        "option",
        {
          key: i,
          value: i },
        i
      ));
    }

    return React.createElement(
      Input,
      {
        type: "select",
        label: "Day",
        labelClassName: "sr-only",
        wrapperClassName: "col-sm-12",
        onChange: this.setDay.bind(this),
        defaultValue: this.state.selectedDay,
        ref: "selectedDay" },
      React.createElement(
        "option",
        { value: -1 },
        "Day"
      ),
      optionsDays
    );
  };

  TemporalConfigurator.prototype.render = function render() {
    return React.createElement(
      "form",
      { className: "form-horizontal" },
      this.renderYears(),
      this.renderMonths(),
      this.renderDays()
    );
  };

  return TemporalConfigurator;
}(React.Component);

var TemporalViewer = function (_React$Component6) {
  _inherits(TemporalViewer, _React$Component6);

  function TemporalViewer() {
    _classCallCheck(this, TemporalViewer);

    return _possibleConstructorReturn(this, _React$Component6.apply(this, arguments));
  }

  TemporalViewer.prototype.render = function render() {
    return React.createElement(SieveTable, {
      cols: ["Year", "Month", "Day", "Time"],
      rows: [[1989, "January", 1, "14:35"], [1989, "February", 1, "14:35"], [1989, "March", 1, "14:35"], [1990, "January", 1, "14:35"], [1990, "February", 1, "14:35"], [1990, "March", 1, "14:35"], [1991, "January", 1, "14:35"], [1991, "February", 1, "14:35"], [1991, "March", 1, "14:35"]] });
  };

  return TemporalViewer;
}(React.Component);

var SieveTable = function (_React$Component7) {
  _inherits(SieveTable, _React$Component7);

  function SieveTable() {
    _classCallCheck(this, SieveTable);

    return _possibleConstructorReturn(this, _React$Component7.apply(this, arguments));
  }

  SieveTable.prototype.render = function render() {
    return React.createElement(
      Table,
      { striped: true, hover: true, responsive: true },
      this.props.cols ? React.createElement(TableHead, { cols: this.props.cols }) : null,
      this.props.rows.length > 0 ? React.createElement(TableBody, { rows: this.props.rows }) : null
    );
  };

  return SieveTable;
}(React.Component);

var TableHead = function (_React$Component8) {
  _inherits(TableHead, _React$Component8);

  function TableHead() {
    _classCallCheck(this, TableHead);

    return _possibleConstructorReturn(this, _React$Component8.apply(this, arguments));
  }

  TableHead.prototype.render = function render() {
    var cols = this.props.cols.map(function (column) {
      return React.createElement(
        "th",
        null,
        column
      );
    });
    return React.createElement(
      "thead",
      null,
      React.createElement(
        "tr",
        null,
        cols
      )
    );
  };

  return TableHead;
}(React.Component);

var TableBody = function (_React$Component9) {
  _inherits(TableBody, _React$Component9);

  function TableBody() {
    _classCallCheck(this, TableBody);

    return _possibleConstructorReturn(this, _React$Component9.apply(this, arguments));
  }

  TableBody.prototype.render = function render() {
    var rows = this.props.rows.map(function (row) {
      var data = row.map(function (data) {
        return React.createElement(
          "td",
          null,
          data
        );
      });
      return React.createElement(
        "tr",
        null,
        data
      );
    });
    return React.createElement(
      "tbody",
      null,
      rows
    );
  };

  return TableBody;
}(React.Component);

var Filter = function (_React$Component10) {
  _inherits(Filter, _React$Component10);

  function Filter(props) {
    _classCallCheck(this, Filter);

    var _this13 = _possibleConstructorReturn(this, _React$Component10.call(this, props));

    _this13.state = {
      buttonDisabled: true,
      action: 'exclusive',
      comparate: 'value',
      comparison: 'lt',
      benchmark: null
    };
    return _this13;
  }

  Filter.prototype.validateFilter = function validateFilter() {
    for (var i = 0; i < this.props.filters.length; i++) {
      if (this.props.filters[i].key == this.state.action + this.state.comparate + this.state.comparison + this.renderBenchmark()) {
        this.setState({ buttonDisabled: true, benchmark: null });

        return false;
      }
    }
    this.setState({ buttonDisabled: null });

    return true;
  };

  Filter.prototype.addFilter = function addFilter() {
    if (this.validateFilter() == true) {
      var filters = this.props.filters.slice();
      filters.push({
        action: this.state.action,
        comparison: this.state.comparison,
        comparate: this.state.comparate,
        benchmark: this.state.benchmark,
        key: this.state.action + this.state.comparate + this.state.comparison + this.renderBenchmark()
      });
      this.props.updateFilters(filters);
      this.resetForm();
    } else if (this.validateFilter() == false) {
      console.log('getting here');
    }
  };

  Filter.prototype.removeFilter = function removeFilter(filter) {
    var filters = this.props.filters;
    for (var i = 0; i < filters.length; i++) {
      if (this.props.filters[i].key == filter) {
        filters.splice(i, 1);
      }
    }
    this.props.updateFilters(filters);
  };

  Filter.prototype.resetForm = function resetForm() {
    this.setState({
      buttonDisabled: true,
      action: 'exclusive',
      comparate: 'value',
      comparison: 'lt',
      benchmark: null
    });
  };

  Filter.prototype.updateAction = function updateAction(e) {
    this.setState({ action: e.target.value });
  };

  Filter.prototype.updateComparate = function updateComparate(e) {
    this.setState({
      buttonDisabled: true,
      comparate: e.target.value,
      benchmark: null
    });
  };

  Filter.prototype.updateComparison = function updateComparison(e) {
    this.setState({ comparison: e.target.value });
  };

  Filter.prototype.updateBenchmark = function updateBenchmark(e) {
    var buttonDisabled = true;
    if (e.target.value) {
      buttonDisabled = false;
    }
    this.setState({
      buttonDisabled: buttonDisabled,
      benchmark: e.target.value
    });
  };

  Filter.prototype.renderBenchmark = function renderBenchmark() {
    if (this.state.benchmark.hasOwnProperty('month') && this.state.benchmark.hasOwnProperty('day')) {
      return this.state.benchmark.month + "-" + this.state.benchmark.day;
    }
    return this.state.benchmark;
  };

  Filter.prototype.updateDay = function updateDay(e) {
    var benchmark = this.state.benchmark,
        buttonDisabled = true;

    if (!benchmark) {
      benchmark = { month: null, day: null };
    }

    benchmark[e.target.id] = e.target.value;

    if (benchmark.month && benchmark.day) {
      buttonDisabled = false;
    }

    this.setState({ buttonDisabled: buttonDisabled, benchmark: benchmark });
  };

  Filter.prototype.render = function render() {
    return React.createElement(
      Row,
      null,
      React.createElement(
        Col,
        { sm: 4 },
        React.createElement(
          "form",
          null,
          React.createElement(
            Input,
            { value: this.state.action, type: "select", onChange: this.updateAction.bind(this) },
            React.createElement(
              "option",
              { value: "exclusive" },
              "Exclude rows where"
            ),
            React.createElement(
              "option",
              { value: "inclusive" },
              "Include rows where"
            )
          ),
          React.createElement(
            Input,
            { value: this.state.comparate, type: "select", onChange: this.updateComparate.bind(this) },
            React.createElement(
              "option",
              { value: "value" },
              "value is"
            ),
            React.createElement(
              "option",
              { value: "day" },
              "day is"
            )
          ),
          React.createElement(
            Input,
            { value: this.state.comparison, type: "select", onChange: this.updateComparison.bind(this) },
            React.createElement(
              "option",
              { value: "lt" },
              "Less than"
            ),
            React.createElement(
              "option",
              { value: "lte" },
              "Less than or equal to"
            ),
            React.createElement(
              "option",
              { value: "et" },
              "Equal to"
            ),
            React.createElement(
              "option",
              { value: "gt" },
              "Greater than"
            ),
            React.createElement(
              "option",
              { value: "gte" },
              "Greater than or equal to"
            )
          ),
          this.state.comparate == 'value' ? React.createElement(Input, { value: this.state.benchmark, type: "text", placeholder: "x", onChange: this.updateBenchmark.bind(this) }) : React.createElement(
            Row,
            { onChange: this.updateDay.bind(this) },
            React.createElement(
              Col,
              { xs: 6 },
              React.createElement(Input, { id: "month", type: "text", placeholder: "Month" })
            ),
            React.createElement(
              Col,
              { xs: 6 },
              React.createElement(Input, { id: "day", type: "text", placeholder: "Day" })
            )
          ),
          React.createElement(
            Button,
            {
              className: "pull-right",
              disabled: this.state.buttonDisabled,
              onClick: this.addFilter.bind(this) },
            "Add Filter"
          )
        )
      ),
      React.createElement(
        Col,
        { sm: 8 },
        React.createElement(
          Panel,
          null,
          React.createElement(FilterList, { filters: this.props.filters, removeFilter: this.removeFilter.bind(this) })
        )
      )
    );
  };

  return Filter;
}(React.Component);

var FilterList = function (_React$Component11) {
  _inherits(FilterList, _React$Component11);

  function FilterList() {
    _classCallCheck(this, FilterList);

    return _possibleConstructorReturn(this, _React$Component11.apply(this, arguments));
  }

  FilterList.prototype.render = function render() {
    var _this15 = this;

    var filters = this.props.filters.map(function (filter) {
      return React.createElement(FilterListItem, { key: filter.key, filter: filter, removeFilter: _this15.props.removeFilter });
    });
    return React.createElement(
      Table,
      { striped: true, hover: true, responsive: true },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement(
            "th",
            null,
            "Type of Filter"
          ),
          React.createElement(
            "th",
            null,
            "Value Compared"
          ),
          React.createElement(
            "th",
            null,
            "Method of Comparison"
          ),
          React.createElement(
            "th",
            null,
            "Value for Comparison"
          ),
          React.createElement("th", null)
        )
      ),
      React.createElement(
        "tbody",
        null,
        filters
      )
    );
  };

  return FilterList;
}(React.Component);

var FilterListItem = function (_React$Component12) {
  _inherits(FilterListItem, _React$Component12);

  function FilterListItem() {
    _classCallCheck(this, FilterListItem);

    return _possibleConstructorReturn(this, _React$Component12.apply(this, arguments));
  }

  FilterListItem.prototype.render = function render() {
    return React.createElement(
      "tr",
      null,
      React.createElement(
        "td",
        null,
        this.props.filter.action
      ),
      React.createElement(
        "td",
        null,
        this.props.filter.comparate
      ),
      React.createElement(
        "td",
        null,
        this.props.filter.comparison
      ),
      React.createElement(
        "td",
        null,
        _typeof(this.props.filter.benchmark) == "object" ? this.props.filter.benchmark.month + "-" + this.props.filter.benchmark.day : this.props.filter.benchmark
      ),
      React.createElement(
        "td",
        null,
        React.createElement(
          Button,
          {
            bsSize: "xsmall",
            onClick: this.props.removeFilter.bind(null, this.props.filter.key) },
          " x "
        )
      )
    );
  };

  return FilterListItem;
}(React.Component);

var Aggregate = function (_React$Component13) {
  _inherits(Aggregate, _React$Component13);

  function Aggregate(props) {
    _classCallCheck(this, Aggregate);

    var _this17 = _possibleConstructorReturn(this, _React$Component13.call(this, props));

    _this17.state = {
      aggregateDimension: _this17.props.dimension,
      aggregateMethod: _this17.props.method
    };
    return _this17;
  }

  Aggregate.prototype.aggregateDimensionToggle = function aggregateDimensionToggle(dimension) {
    this.setState({ aggregateDimension: dimension });
    if (dimension === null) {
      this.setState({ aggregateMethod: null });
    }
    this.props.updateAggregateDimension(dimension);
  };

  Aggregate.prototype.aggregateMethodToggle = function aggregateMethodToggle(method) {
    if (this.state.aggregateDimension !== null) {
      this.setState({ aggregateMethod: method });
    }
    this.props.updateAggregateMethod(method);
  };

  Aggregate.prototype.render = function render() {
    return React.createElement(
      ButtonToolbar,
      { className: "text-center" },
      React.createElement(
        ButtonGroup,
        null,
        React.createElement(
          Button,
          {
            onClick: this.aggregateDimensionToggle.bind(this, "SP"),
            active: this.state.aggregateDimension === "SP" ? true : null },
          "Aggregate Across Space"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateDimensionToggle.bind(this, "TM"),
            active: this.state.aggregateDimension === "TM" ? true : null },
          "Aggregate Across Time"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateDimensionToggle.bind(this, 'NA'),
            active: this.state.aggregateDimension === 'NA' ? true : null },
          "Do Not Aggregate"
        )
      ),
      React.createElement(
        ButtonGroup,
        null,
        React.createElement(
          Button,
          {
            onClick: this.aggregateMethodToggle.bind(this, "MEA"),
            active: this.state.aggregateMethod === "MEA" ? true : null },
          "Mean"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateMethodToggle.bind(this, "MED"),
            active: this.state.aggregateMethod === "MED" ? true : null },
          "Median"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateMethodToggle.bind(this, "MOD"),
            active: this.state.aggregateMethod === "MOD" ? true : null },
          "Mode"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateMethodToggle.bind(this, "RAN"),
            active: this.state.aggregateMethod === "RAN" ? true : null },
          "Range"
        ),
        React.createElement(
          Button,
          {
            onClick: this.aggregateMethodToggle.bind(this, "STD"),
            active: this.state.aggregateMethod === "STD" ? true : null },
          "Std. Dev."
        )
      )
    );
  };

  return Aggregate;
}(React.Component);
'use strict';

function layers() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {
    name: 'Layers',
    isFetching: false,
    didInvalidate: false,
    items: []
  } : arguments[0];
  var action = arguments[1];

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

function tables() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {
    name: 'Tables',
    isFetching: false,
    didInvalidate: false,
    items: []
  } : arguments[0];
  var action = arguments[1];

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

function rasterCatalog() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {
    items: []
  } : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case RECEIVE_RASTER_CATALOG:
      return Object.assign({}, state, {
        items: action.raster_catalog,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
}

function variables() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {
    name: 'Variables',
    isFetching: false,
    didInvalidate: false,
    items: []
  } : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case REQUEST_VARIABLES:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false
      });
    case RECEIVE_VARIABLES:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        items: action.variables,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
}

function input_variables() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case ADD_INPUT_VARIABLE:
      return [].concat(state, [action.variable]);
    case REMOVE_INPUT_VARIABLE:
      return state.slice(0, action.index).concat(state.slice(action.index + 1));
    case EDIT_INPUT_VARIABLE:
      state.splice(action.index, 1, action.variable);
      return state;
    default:
      return state;
  }
}

var nextNodeId = 1;
var EMPTY = 'EMPTY';

function separateOperands(operands, tree) {
  return operands.map(function (operand) {
    var id = nextNodeId;
    nextNodeId++;
    if (operand == EMPTY || operand.constructor != Array || operand.length != 2) {
      tree[id] = ['const', operand];
    } else {
      tree[id] = [operand[0], separateOperands(operand[1], tree)];
    }
    return id;
  });
}

function tree() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case INIT_TREE:
      {
        var tree = {
          0: [action.node[0], []]
        };
        tree[0][1] = separateOperands(action.node[1], tree);

        return tree;
      }
    case EDIT_TREE_NODE:
      {
        var new_tree = Object.assign({}, state);
        if (action.node.constructor != Array || action.node.length != 2) {
          new_tree[action.id] = ['const', action.node];
        } else {
          new_tree[action.id] = [action.node[0], separateOperands(action.node[1], new_tree)];
        }
        return new_tree;
      }
    default:
      return state;
  }
}

function operandSelections() {
  var _Object$assign;

  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case CHANGE_OPERAND_SELECTION:
      return Object.assign({}, state, (_Object$assign = {}, _Object$assign[action.id] = action.value, _Object$assign));
  }
}
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ReactBootstrap = ReactBootstrap;
var Panel = _ReactBootstrap.Panel;
var ButtonGroup = _ReactBootstrap.ButtonGroup;
var ButtonToolbar = _ReactBootstrap.ButtonToolbar;
var ButtonInput = _ReactBootstrap.ButtonInput;
var Button = _ReactBootstrap.Button;
var Row = _ReactBootstrap.Row;
var Col = _ReactBootstrap.Col;
var Alert = _ReactBootstrap.Alert;
var Tabs = _ReactBootstrap.Tabs;
var DropdownButton = _ReactBootstrap.DropdownButton;
var MenuItem = _ReactBootstrap.MenuItem;
var Table = _ReactBootstrap.Table;
var Modal = _ReactBootstrap.Modal;
var FormControl = _ReactBootstrap.FormControl;
var ControlLabel = _ReactBootstrap.ControlLabel;
var FormGroup = _ReactBootstrap.FormGroup;
var HelpBlock = _ReactBootstrap.HelpBlock;

/* app */

// Interface states

var DEFAULT = 'DEFAULT';
var ADDING_DATA_SOURCE = 'ADDING_DATA_SOURCE';
var EDITING_TABULAR_DATA = 'EDITING_TABULAR_DATA';
var EDITING_RASTER_DATA = 'EDITING_RASTER_DATA';
var EDITING_EXPRESSION = 'EDITING_EXPRESSION';

var initialState = Object.assign({
  errors: { "name": null, "tree": null },
  name: "",
  tree: {},
  description: "",
  spatialDomain: null,
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  interfaceState: DEFAULT,
  tabularData: {},
  rasterData: {},
  expressionData: {},
  operandSelections: {}
}, window.sieve_props);

function sieveApp() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case REQUEST_LAYERS:
    case RECEIVE_LAYERS:
      return Object.assign({}, state, {
        layers: layers(state.layers, action)
      });
    case REQUEST_TABLES:
    case RECEIVE_TABLES:
      return Object.assign({}, state, {
        tables: tables(state.tables, action)
      });
    case REQUEST_VARIABLES:
    case RECEIVE_VARIABLES:
      return Object.assign({}, state, {
        variables: variables(state.variables, action)
      });
    case RECEIVE_RASTER_CATALOG:
      return Object.assign({}, state, {
        raster_catalog: rasterCatalog(state.raster_catalog, action)
      });
    case UPDATE_NAME:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        changed: true,
        name: action.name,
        errors: Object.assign({}, state.errors, errors)
      });
    case UPDATE_DESCRIPTION:
      return Object.assign({}, state, {
        changed: true,
        description: action.description
      });
    case UPDATE_SPATIAL_DOMAIN:
      return Object.assign({}, state, {
        spatialDomain: action.layer_id
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        changed: true,
        tree: action.tree,
        errors: Object.assign({}, state.errors, { tree: action.error })
      });
    case UPDATE_ERRORS:
      return Object.assign({}, state, {
        errors: action.errors
      });
    case INIT_TREE:
    case EDIT_TREE_NODE:
      return Object.assign({}, state, {
        changed: true,
        tree: tree(state.tree, action)
      });
    case ADD_INPUT_VARIABLE:
    case REMOVE_INPUT_VARIABLE:
    case EDIT_INPUT_VARIABLE:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        changed: true,
        errors: Object.assign({}, state.errors, errors),
        input_variables: input_variables(state.input_variables, action),
        editingTabularData: false,
        editingRasterData: false,
        editingExpressionData: false
      });
    case ERROR_INPUT_VARIABLE:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        errors: Object.assign({}, state.errors, errors)
      });
    case CHANGE_OPERAND_SELECTION:
      return Object.assign({}, state, {
        operandSelections: operandSelections(state.operandSelections, action)
      });
    case UPDATE_MODIFIED:
      return Object.assign({}, state, {
        modified: action.time
      });
    case UPDATE_CREATED:
      return Object.assign({}, state, {
        created: action.time
      });
    case CHANGE_INTERFACE_STATE:
      return Object.assign({}, state, {
        interfaceState: action.state
      });
    case EDIT_RASTER_DATA:
      return Object.assign({}, state, {
        rasterData: action.data
      });
    case EDIT_TABULAR_DATA:
      return Object.assign({}, state, {
        tabularData: action.data
      });
    case EDIT_EXPRESSION_DATA:
      return Object.assign({}, state, {
        expressionData: action.data
      });
    default:
      return state;
  }
}

var mapStateToProps = function mapStateToProps(state) {
  return Object.assign({}, state);
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    onSaveVariable: function onSaveVariable(v, c) {
      dispatch(saveVariable(v, c));
    },
    onNameChange: function onNameChange(name, field) {
      dispatch(updateName(name, field));
    },
    onDescriptionChange: function onDescriptionChange(e) {
      dispatch(updateDescription(e.target.value));
    },
    onSpatialDomainChange: function onSpatialDomainChange(e) {
      if (e == null) dispatch(updateSpatialDomain(null));else dispatch(updateSpatialDomain(e.value));
    },
    onAddInputVariable: function onAddInputVariable(variable) {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: function onRemoveInputVariable(i) {
      dispatch(removeInputVariable(i));
    },
    onEditInputVariable: function onEditInputVariable(variable, i) {
      dispatch(editInputVariable(variable, i));
    },
    onInitTree: function onInitTree(node) {
      dispatch(initTree(node));
    },
    onEditTreeNode: function onEditTreeNode(id, node) {
      dispatch(editTreeNode(id, node));
    },
    onChangeOperandSelection: function onChangeOperandSelection(id, value) {
      dispatch(changeOperandSelection(id, value));
    },
    onChangeInterfaceState: function onChangeInterfaceState(newState) {
      dispatch(changeInterfaceState(newState));
    },
    onEditRasterData: function onEditRasterData(data) {
      dispatch(editRasterData(data));
    },
    onEditTabularData: function onEditTabularData(data) {
      dispatch(editTabularData(data));
    },
    onEditExpressionData: function onEditExpressionData(data) {
      dispatch(editExpressionData(data));
    }
  };
};

/* components */

//  layer or table item to bare dict option
var i2o = function i2o(type, item, i) {
  return function (item, i) {
    if (item.field_names) {
      return item.field_names.map(function (field, j) {
        return React.createElement(
          'option',
          { value: '{"type":"' + type + '","name":"' + item.name + '","id":' + item.id + ',"field":"' + field + '"}' },
          item.name + '/' + field
        );
      });
    }
  };
};

var SpatialConfiguration = function (_React$Component) {
  _inherits(SpatialConfiguration, _React$Component);

  function SpatialConfiguration() {
    _classCallCheck(this, SpatialConfiguration);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  SpatialConfiguration.prototype.componentDidMount = function componentDidMount() {
    var map = this.map = L.map('spatial-config-map').setView([0, 0], 2);

    this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'ags.n5m0p5ci',
      accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
    }).addTo(map);

    if (this.props.spatialDomain) {
      this.updateMap(this.props.spatialDomain);
    }
  };

  SpatialConfiguration.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    if (prevProps.spatialDomain != this.props.spatialDomain) {
      if (this.geoJsonTileLayer) this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatialDomain) {
        this.updateMap(this.props.spatialDomain);
      }
    }
  };

  SpatialConfiguration.prototype.updateMap = function updateMap(layer_id) {
    var _this2 = this;

    var geoJsonURL = '/layers/' + layer_id + '/{z}/{x}/{y}.json';
    this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
      clipTiles: true,
      unique: function unique(feature) {
        return feature.properties.id;
      }
    }, {
      style: {
        weight: 1
      },
      pointToLayer: function pointToLayer(feature, latlng) {
        return new L.CircleMarker(latlng, {
          radius: 4,
          fillColor: "#A3C990",
          color: "#000",
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.3
        });
      }
    });

    this.map.addLayer(this.geoJsonTileLayer);

    $.ajax('/api/layers/' + layer_id, {
      dataType: 'json',
      success: function success(data, status, xhr) {
        var bounds = [[data['bounds'][1], data['bounds'][0]], [data['bounds'][3], data['bounds'][2]]];
        _this2.map.fitBounds(bounds);
      }
    });
  };

  SpatialConfiguration.prototype.render = function render() {
    var layer_options = this.props.layers.items.map(function (layer) {
      return { value: layer.id, label: layer.name };
    });

    return React.createElement(
      Panel,
      { header: 'Spatial configuration' },
      React.createElement(Select, { value: this.props.spatialDomain, options: layer_options,
        onChange: this.props.onSpatialDomainChange }),
      React.createElement('div', { id: 'spatial-config-map', style: { height: 400, marginTop: 10 } })
    );
  };

  return SpatialConfiguration;
}(React.Component);

var TabularDataSource = function (_React$Component2) {
  _inherits(TabularDataSource, _React$Component2);

  function TabularDataSource() {
    _classCallCheck(this, TabularDataSource);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  TabularDataSource.prototype.onSave = function onSave() {
    if (this.props.errors.tabularDataName) return; // Do not submit if there are errors
    var name = this.props.tabularData.name;
    if (name == null || name.length == 0) {
      name = this.props.tabularData.defaultName;
    }

    var variable = {
      name: name,
      node: ['join', [this.props.tabularData.source1, this.props.tabularData.source2]]
    };
    var index = this.props.tabularData.index;
    var isEditing = this.props.tabularData.isEditing;

    if (isEditing) {
      this.props.onEditInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onEditTabularData({
      name: "",
      source1: "",
      source2: "",
      isEditing: false,
      index: -1
    });

    this.props.onChangeInterfaceState(DEFAULT);
  };

  TabularDataSource.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.tabularData.defaultName || newProps.input_variables != this.props.input_variables) {
      var t1 = newProps.tables.items[0];
      if (t1) {
        var source1 = { name: t1.name, field: t1.field_names[0] };
        var source2 = Object.assign({}, source1);
        var name = this.generateName(source1, source2, newProps.input_variables);
        var data = Object.assign({}, newProps.tabularData, { defaultName: name });

        if (!this.props.tabularData.source1) data.source1 = source1;
        if (!this.props.tabularData.source2) data.source2 = source2;

        this.props.onEditTabularData(data);
      }
    }
  };

  TabularDataSource.prototype.generateName = function generateName(source1, source2) {
    var var_list = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    if (source1.name == source2.name) {
      var name = source1.name + '-' + source1.field + '-' + source2.field;
    } else {
      var name = source1.name + '-' + source2.name;
    }
    name = name.replace(/_/g, "-");
    var i = 1;
    var input_variables = [];
    if (var_list) {
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach(function (input) {
      if (name + '-' + i == input.name) {
        i++;
      }
    });

    return name + '-' + i;
  };

  TabularDataSource.prototype.validate = function validate() {
    var form = $(this.form).serializeArray();
    var name = form[2]['value'];
    if (name.length > 0) this.props.onNameChange(name, "tabularDataName");
    var source1 = JSON.parse(form[0]['value']);
    var source2 = JSON.parse(form[1]['value']);
    var defaultName = this.generateName(source1, source2);

    var data = Object.assign({}, this.props.tabularData, {
      name: name,
      source1: source1,
      source2: source2,
      defaultName: defaultName
    });

    this.props.onEditTabularData(data);
  };

  TabularDataSource.prototype.sourceToString = function sourceToString(source) {
    return JSON.stringify(source);
  };

  TabularDataSource.prototype.render = function render() {
    var _this4 = this;

    return React.createElement(
      Panel,
      { header: 'Tabular data' },
      React.createElement(
        'form',
        { ref: function ref(_ref) {
            _this4.form = _ref;
          }, onChange: this.validate.bind(this) },
        React.createElement(
          FormGroup,
          { controlId: 'formSelectSource' },
          React.createElement(
            ControlLabel,
            null,
            'Source 1'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              value: this.sourceToString(this.props.tabularData.source1),
              name: 'table'
            },
            this.props.tables.items.map(i2o('Table')).concat(this.props.layers.items.map(i2o('Layer')))
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: 'formSelectDest' },
          React.createElement(
            ControlLabel,
            null,
            'Source 2'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              name: 'layer',
              value: this.sourceToString(this.props.tabularData.source2)
            },
            this.props.tables.items.map(i2o('Table')).concat(this.props.layers.items.map(i2o('Layer')))
          )
        ),
        React.createElement(
          FormGroup,
          {
            validationState: this.props.errors.tabularDataName ? 'error' : null,
            controlId: 'name' },
          React.createElement(
            ControlLabel,
            null,
            'Name'
          ),
          React.createElement(FormControl, {
            name: 'name', type: 'text',
            placeholder: this.props.tabularData.defaultName,
            value: this.props.tabularData.name
          }),
          React.createElement(
            HelpBlock,
            null,
            this.props.errors.tabularDataName ? this.props.errors.tabularDataName : "Name must be alphanumeric, without spaces."
          )
        ),
        React.createElement(
          Button,
          { onClick: this.onSave.bind(this) },
          'Add'
        ),
        React.createElement(
          Button,
          { onClick: this.props.onChangeInterfaceState.bind(this, DEFAULT) },
          'Cancel'
        )
      )
    );
  };

  return TabularDataSource;
}(React.Component);

var dateToDOY = function dateToDOY(date) {
  var year = date.getFullYear();
  var oneDay = 1000 * 60 * 60 * 24; // A day in milliseconds

  var doy = (Date.UTC(year, date.getMonth(), date.getDate()) - Date.UTC(year, 0, 0)) / 24 / 60 / 60 / 1000;

  var doyStr = doy.toString();
  while (doyStr.length < 3) {
    //pad with zeros
    doyStr = "0" + doyStr;
  }

  return year.toString() + "-" + doyStr;
};

var RasterDataSource = function (_React$Component3) {
  _inherits(RasterDataSource, _React$Component3);

  function RasterDataSource() {
    _classCallCheck(this, RasterDataSource);

    return _possibleConstructorReturn(this, _React$Component3.apply(this, arguments));
  }

  RasterDataSource.prototype.onSave = function onSave() {
    if (this.props.errors.rasterDataName || this.props.errors.rasterDate) return; // Do not submit if there are errors

    var name = this.props.rasterData.name;
    if (name == null || name.length == 0) {
      name = this.props.rasterData.defaultName;
    }

    var variable = {
      name: name,
      node: ['raster', [this.props.rasterData.raster, this.props.spatialDomain, this.props.rasterData.temporalRangeStart + ',' + this.props.rasterData.temporalRangeEnd]]
    };
    var index = this.props.rasterData.index;
    var isEditing = this.props.rasterData.isEditing;

    this.props.onEditRasterData({
      name: "",
      raster: "",
      temporalRangeStart: "",
      temporalRangeEnd: "",
      isEditing: false,
      index: -1,
      defaultName: null
    });

    if (isEditing) {
      this.props.onEditInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }
    this.props.onChangeInterfaceState(DEFAULT);
  };

  RasterDataSource.prototype.sourceToString = function sourceToString(source) {
    return JSON.stringify(source);
  };

  RasterDataSource.prototype.generateName = function generateName(raster) {
    var var_list = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    var name = raster.id.replace(/_/g, "-");
    var i = 1;

    var input_variables = [];
    if (var_list) {
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach(function (input) {
      if (name + '-' + i == input.name) {
        i++;
      }
    });

    return name + '-' + i;
  };

  RasterDataSource.prototype.componentDidMount = function componentDidMount() {
    var _this6 = this;

    var format = {
      toDisplay: function toDisplay(date, format, language) {
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        var d = new Date(date.getTime() + userTimezoneOffset);
        return dateToDOY(d);
      },
      toValue: function toValue(date, format, language) {
        var d = new Date(date);
        return d;
      }
    };

    $(this.startpicker).datepicker({
      format: format
    }).on("changeDate", function (e) {
      _this6.validate();
    });

    $(this.endpicker).datepicker({
      format: format
    }).on("changeDate", function (e) {
      _this6.validate();
    });
  };

  RasterDataSource.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.rasterData.defaultName || newProps.input_variables != this.props.input_variables) {
      var raster = newProps.raster_catalog.items[0];
      var raster2 = Object.assign({}, raster, { id: raster.name });
      var name = this.generateName(raster2, newProps.input_variables);
      var data = Object.assign({}, newProps.rasterData, { defaultName: name });
      if (!this.props.rasterData.raster) data.raster = raster;
      this.props.onEditRasterData(data);
    }
  };

  RasterDataSource.prototype.updateDefaultName = function updateDefaultName() {
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if (!name || name.length < 1) {
      var raster = JSON.parse(form[0]['value']);
      var data = Object.assign({}, this.props.rasterData, { defaultName: this.generateName(raster) });
      this.props.onEditRasterData(data);
    }
  };

  RasterDataSource.prototype.validate = function validate() {
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if (name.length > 0) this.props.onNameChange(name, "rasterDataName");
    var raster = JSON.parse(form[0]['value']);
    var temporalRangeStart = form[1]['value'];
    var temporalRangeEnd = form[2]['value'];
    var defaultName = this.generateName(raster);

    var data = Object.assign({}, this.props.rasterData, {
      name: name,
      raster: raster,
      temporalRangeStart: temporalRangeStart,
      temporalRangeEnd: temporalRangeEnd,
      defaultName: defaultName
    });

    this.props.onEditRasterData(data);
  };

  RasterDataSource.prototype.render = function render() {
    var _this7 = this;

    return React.createElement(
      Panel,
      { header: 'Raster data' },
      React.createElement(
        'form',
        { ref: function ref(_ref4) {
            _this7.form = _ref4;
          }, onChange: this.validate.bind(this) },
        React.createElement(
          FormGroup,
          { controlId: 'rightSelect' },
          React.createElement(
            ControlLabel,
            null,
            'Raster'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              name: 'right',
              value: this.sourceToString(this.props.rasterData.raster)
            },
            this.props.raster_catalog.items.map(function (r, i) {
              return React.createElement(
                'option',
                { key: i, value: '{"name":"' + r.description + '","id":"' + r.name + '"}' },
                r.description + ': ' + r.band
              );
            })
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: 'range',
            validationState: this.props.errors.rasterDataTemporalRange ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            'Temporal Range'
          ),
          React.createElement(
            'div',
            { 'class': 'input-group input-daterange' },
            React.createElement('input', {
              ref: function ref(_ref2) {
                _this7.startpicker = _ref2;
              },
              name: 'temporalRangeStart', type: 'text', placeholder: 'yyyy-ddd',
              value: this.props.rasterData.temporalRangeStart
            }),
            React.createElement(
              'span',
              { 'class': 'input-group-addon' },
              'to'
            ),
            React.createElement('input', {
              ref: function ref(_ref3) {
                _this7.endpicker = _ref3;
              },
              name: 'temporalRangeEnd', type: 'text', placeholder: 'yyyy-ddd',
              value: this.props.rasterData.temporalRangeEnd
            })
          ),
          React.createElement(
            HelpBlock,
            null,
            this.props.errors.rasterDataTemporalRange ? this.props.errors.rasterDataTemporalRange : "Date must be entered in the form yyyy-ddd."
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: 'name',
            validationState: this.props.errors.rasterDataName ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            'Name'
          ),
          React.createElement(FormControl, {
            name: 'name', type: 'text',
            placeholder: this.props.rasterData.defaultName,
            value: this.props.rasterData.name
          }),
          React.createElement(
            HelpBlock,
            null,
            this.props.errors.rasterDataName ? this.props.errors.rasterDataName : "Name must be alphanumeric, without spaces."
          )
        ),
        React.createElement(
          Button,
          { onClick: this.onSave.bind(this) },
          'Add'
        ),
        React.createElement(
          Button,
          { onClick: this.props.onChangeInterfaceState.bind(this, DEFAULT) },
          'Cancel'
        )
      )
    );
  };

  return RasterDataSource;
}(React.Component);

var OperandChooser = function (_React$Component4) {
  _inherits(OperandChooser, _React$Component4);

  function OperandChooser() {
    _classCallCheck(this, OperandChooser);

    return _possibleConstructorReturn(this, _React$Component4.apply(this, arguments));
  }

  OperandChooser.prototype.changeOperand = function changeOperand(e) {
    var operand_refs = this.props.expressionData.operand_refs;
    operand_refs[this.props.operand_index] = e.value;

    var expressionData = Object.assign({}, this.props.expressionData, { operand_refs: operand_refs });
    this.props.onEditExpressionData(expressionData);
  };

  OperandChooser.prototype.render = function render() {
    var options = this.props.input_variables.map(function (input_var) {
      return { value: input_var.name, label: input_var.name };
    });
    return React.createElement(
      'div',
      { style: { display: "inline-block", width: 400 } },
      React.createElement(Select, { onChange: this.changeOperand.bind(this),
        value: this.props.expressionData.operand_refs[this.props.operand_index],
        options: options,
        clearable: false })
    );
  };

  return OperandChooser;
}(React.Component);

var TreeViewer = function (_React$Component5) {
  _inherits(TreeViewer, _React$Component5);

  function TreeViewer() {
    _classCallCheck(this, TreeViewer);

    return _possibleConstructorReturn(this, _React$Component5.apply(this, arguments));
  }

  TreeViewer.prototype.render = function render() {
    var operand_inputs = [];
    for (var i = 0; i < this.props.tree.arity; i++) {
      operand_inputs.push(React.createElement(OperandChooser, _extends({}, this.props, { operand_index: i })));
    }

    return React.createElement(
      'span',
      null,
      this.props.tree.name,
      ' ( ',
      operand_inputs,
      ' )'
    );
  };

  return TreeViewer;
}(React.Component);

var ExpressionEditor = function (_React$Component6) {
  _inherits(ExpressionEditor, _React$Component6);

  function ExpressionEditor(props) {
    _classCallCheck(this, ExpressionEditor);

    var _this10 = _possibleConstructorReturn(this, _React$Component6.call(this));

    var data = { defaultName: _this10.generateName(props.input_variables) };
    props.onEditExpressionData(data);
    return _this10;
  }

  ExpressionEditor.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.expressionData.defaultName || newProps.input_variables != this.props.input_variables) {
      var data = { defaultName: this.generateName(newProps.input_variables) };
      this.props.onEditExpressionData(data);
    }
  };

  ExpressionEditor.prototype.generateName = function generateName() {
    var var_list = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    var i = 1;
    var input_variables = [];
    if (var_list) {
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach(function (input) {
      if (input.name == 'expression-' + i) {
        i++;
      }
    });
    return 'expression-' + i;
  };

  ExpressionEditor.prototype.changeName = function changeName(e) {
    var expressionData = Object.assign({}, this.props.expressionData, { name: e.target.value });
    this.props.onEditExpressionData(expressionData);
  };

  ExpressionEditor.prototype.addOp = function addOp(op) {
    var node_object = treeToNode(op);
    var expressionData = Object.assign({}, this.props.expressionData, { node: op, operand_refs: Array(node_object.arity) });
    this.props.onEditExpressionData(expressionData);
  };

  ExpressionEditor.prototype.populateOperands = function populateOperands(arity) {
    var _this11 = this;

    var operands = [];

    for (var i = 0; i < arity; i++) {
      var operand_tree = this.props.input_variables.filter(function (input_var) {
        return input_var.name == _this11.props.expressionData.operand_refs[i];
      })[0].node;

      operands.push(operand_tree);
    }

    return operands;
  };

  ExpressionEditor.prototype.onSave = function onSave() {
    var expressionData = this.props.expressionData;
    if (expressionData.node && expressionData.node.length == 2) {
      if (!expressionData.name || expressionData.name == "") {
        expressionData.name = expressionData.defaultName;
      }

      var node = treeToNode(expressionData.node);
      expressionData.node[1] = this.populateOperands(node.arity);

      this.props.onEditExpressionData({ name: "", node: [], operand_refs: [] });
      this.props.onAddInputVariable(expressionData);
      this.props.onChangeInterfaceState(DEFAULT);
    }
  };

  ExpressionEditor.prototype.render = function render() {
    return React.createElement(
      Panel,
      { header: 'Expression editor' },
      React.createElement(
        FormGroup,
        { controlId: 'name' },
        React.createElement(FormControl, { componentClass: 'input',
          placeholder: this.props.expressionData.defaultName,
          onChange: this.changeName.bind(this),
          value: this.props.expressionData.name })
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(
          'div',
          { className: 'pull-right' },
          React.createElement(
            ButtonGroup,
            null,
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['+', [null, null]]) },
              '+'
            ),
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['-', [null, null]]) },
              '-'
            ),
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['*', [null, null]]) },
              '*'
            ),
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['/', [null, null]]) },
              '/'
            ),
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['tmean', [null]]) },
              'Temporal Mean'
            ),
            React.createElement(
              Button,
              { onClick: this.addOp.bind(this, ['smean', [null]]) },
              'Spatial Mean'
            )
          )
        )
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(TreeViewer, _extends({}, this.props, { tree: treeToNode(this.props.expressionData.node) }))
      ),
      React.createElement(
        Button,
        { onClick: this.onSave.bind(this) },
        'Add'
      ),
      React.createElement(
        Button,
        { onClick: this.props.onChangeInterfaceState.bind(this, DEFAULT) },
        'Cancel'
      )
    );
  };

  return ExpressionEditor;
}(React.Component);

var VariableTable = function (_React$Component7) {
  _inherits(VariableTable, _React$Component7);

  function VariableTable() {
    _classCallCheck(this, VariableTable);

    return _possibleConstructorReturn(this, _React$Component7.apply(this, arguments));
  }

  VariableTable.prototype.onUseVariable = function onUseVariable(variable) {
    this.props.onSaveVariable({
      id: this.props.id,
      name: variable.name,
      tree: variable.node,
      input_variables: this.props.input_variables,
      description: this.props.description,
      temporal_domain: this.props.temporal_domain,
      spatial_domain: this.props.spatialDomain
    }, this.props.created);
  };

  VariableTable.prototype.render = function render() {
    var _this13 = this;

    if (this.props.input_variables.length > 0) {
      var item = this.props.input_variables[0];
    }
    return React.createElement(
      Panel,
      { header: 'Variables' },
      React.createElement(
        'div',
        { className: 'pull-right' },
        React.createElement(
          Button,
          { disabled: !this.props.spatialDomain || this.props.input_variables.length == 0,
            onClick: this.props.onChangeInterfaceState.bind(this, EDITING_EXPRESSION) },
          'Add Expression'
        ),
        React.createElement(
          Button,
          { disabled: !this.props.spatialDomain,
            onClick: this.props.onChangeInterfaceState.bind(this, ADDING_DATA_SOURCE) },
          'Add Data Source'
        )
      ),
      React.createElement(
        Table,
        { striped: true },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            React.createElement(
              'th',
              null,
              'Name'
            ),
            React.createElement(
              'th',
              null,
              'Type'
            ),
            React.createElement(
              'th',
              null,
              'Dimensions'
            )
          )
        ),
        React.createElement(
          'tbody',
          null,
          this.props.input_variables.map(function (item, i) {
            var type = item.node[0];
            var operator = treeToNode(item.node);
            return React.createElement(
              'tr',
              null,
              React.createElement(
                'td',
                null,
                item.name
              ),
              React.createElement(
                'td',
                null,
                item.node[0]
              ),
              React.createElement(
                'td',
                null,
                operator.dimensions
              ),
              React.createElement(
                'td',
                null,
                React.createElement(
                  Button,
                  { onClick: _this13.onUseVariable.bind(_this13, item) },
                  'Use'
                ),
                React.createElement(
                  Button,
                  {
                    onClick: function onClick() {
                      if (item.node[0] == "join") {
                        var source1 = item.node[1][0];
                        var source2 = item.node[1][1];
                        _this13.props.onEditTabularData({
                          name: item.name,
                          source1: source1,
                          source2: source2,
                          isEditing: true,
                          index: i
                        });
                      } else if (item.node[0] == "raster") {
                        var raster = item.node[1][0];
                        var temporalRange = item.node[1][2].split(",");

                        _this13.props.onSpatialDomainChange({ value: item.node[1][1] });
                        _this13.props.onEditRasterData({
                          name: item.name,
                          raster: raster,
                          temporalRangeStart: temporalRange[0],
                          temporalRangeEnd: temporalRange[1],
                          isEditing: true,
                          index: i
                        });
                      }
                    } },
                  'Edit'
                )
              ),
              React.createElement(
                'td',
                null,
                React.createElement(
                  Button,
                  {
                    onClick: function onClick() {
                      _this13.props.onRemoveInputVariable(i);
                    } },
                  'Delete'
                )
              )
            );
          })
        )
      )
    );
  };

  return VariableTable;
}(React.Component);

var node2tree = function node2tree(node) {
  var buildTree = function buildTree(node, tree, branch) {
    if (branch[0] == 'const') {
      tree.push(branch[1]);
      return tree;
    } else {
      tree.push(branch[0]);
      var subPaths = branch[1];
      var subBranch = [];
      subPaths.forEach(function (element) {
        buildTree(node, subBranch, node[element]);
      });
      tree.push(subBranch);
      return tree;
    };
  };
  return buildTree(node, [], node[0]);
};

var AddDataSourcePanel = function (_React$Component8) {
  _inherits(AddDataSourcePanel, _React$Component8);

  function AddDataSourcePanel() {
    _classCallCheck(this, AddDataSourcePanel);

    return _possibleConstructorReturn(this, _React$Component8.apply(this, arguments));
  }

  AddDataSourcePanel.prototype.render = function render() {
    return React.createElement(
      Panel,
      { header: 'Add a data source' },
      React.createElement(
        'ul',
        null,
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { href: 'javascript:void(0)',
              onClick: this.props.onChangeInterfaceState.bind(this, EDITING_RASTER_DATA) },
            'Raster Data'
          )
        ),
        React.createElement(
          'li',
          null,
          React.createElement(
            'a',
            { href: 'javascript:void(0)',
              onClick: this.props.onChangeInterfaceState.bind(this, EDITING_TABULAR_DATA) },
            'Tabular Data'
          )
        )
      ),
      React.createElement(
        Button,
        { onClick: this.props.onChangeInterfaceState.bind(this, DEFAULT) },
        'Cancel'
      )
    );
  };

  return AddDataSourcePanel;
}(React.Component);

var SieveComponent = function (_React$Component9) {
  _inherits(SieveComponent, _React$Component9);

  function SieveComponent() {
    _classCallCheck(this, SieveComponent);

    return _possibleConstructorReturn(this, _React$Component9.apply(this, arguments));
  }

  SieveComponent.prototype.renderMiddlePanel = function renderMiddlePanel() {
    if (this.props.spatialDomain) {
      switch (this.props.interfaceState) {
        case EDITING_EXPRESSION:
          return React.createElement(ExpressionEditor, this.props);
        case EDITING_RASTER_DATA:
          return React.createElement(RasterDataSource, this.props);
        case EDITING_TABULAR_DATA:
          return React.createElement(TabularDataSource, this.props);
        case ADDING_DATA_SOURCE:
          return React.createElement(AddDataSourcePanel, this.props);
        default:
          return null;
      }
    }
  };

  SieveComponent.prototype.render = function render() {
    return React.createElement(
      'div',
      { className: 'sieve' },
      React.createElement(
        Row,
        { className: 'show-grid' },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(SpatialConfiguration, this.props)
        )
      ),
      React.createElement(
        Row,
        { className: 'show-grid' },
        React.createElement(
          Col,
          { xs: 11 },
          this.renderMiddlePanel()
        )
      ),
      React.createElement(
        Row,
        { className: 'show-grid' },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(VariableTable, this.props)
        )
      )
    );
  };

  return SieveComponent;
}(React.Component);

var tab = function tab(level) {
  return Array(level * 4).join("&nbsp;");
};
var formatHtml = function formatHtml(html, level) {
  return tab(level) + html;
};

var DataNode = function () {
  function DataNode() {
    _classCallCheck(this, DataNode);
  }

  DataNode.prototype.json = function json() {
    return JSON.encode(data);
  };

  return DataNode;
}();

var MeanOperator = function (_DataNode) {
  _inherits(MeanOperator, _DataNode);

  function MeanOperator(operands) {
    _classCallCheck(this, MeanOperator);

    var _this16 = _possibleConstructorReturn(this, _DataNode.call(this, operands));

    _this16.name = 'Mean';
    _this16.arity = 2;

    if (operands.length != _this16.arity) {
      throw Error('MeanOperator takes exactly ' + _this16.arity + ' operands');
    }

    _this16.left = treeToNode(operands[0]);
    _this16.right = treeToNode(operands[1]);

    if (_this16.left.dimensions != _this16.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    _this16.dimensions = _this16.left.dimensions;
    return _this16;
  }

  MeanOperator.prototype.json = function json() {
    return ['mean', [this.left.json(), this.right.json()]];
  };

  return MeanOperator;
}(DataNode);

var TemporalMeanOperator = function (_DataNode2) {
  _inherits(TemporalMeanOperator, _DataNode2);

  function TemporalMeanOperator(operands) {
    _classCallCheck(this, TemporalMeanOperator);

    var _this17 = _possibleConstructorReturn(this, _DataNode2.call(this, operands));

    _this17.name = 'Temporal Mean';
    _this17.arity = 1;

    if (operands.length != _this17.arity) {
      throw Error('TemporalMeanOperator takes exactly ' + _this17.arity + ' operand');
    }

    _this17.operand = treeToNode(operands[0]);

    _this17.dimensions = 'space';
    return _this17;
  }

  TemporalMeanOperator.prototype.json = function json() {
    return ['tmean', [this.operand.json()]];
  };

  return TemporalMeanOperator;
}(DataNode);

var SpatialMeanOperator = function (_DataNode3) {
  _inherits(SpatialMeanOperator, _DataNode3);

  function SpatialMeanOperator(operands) {
    _classCallCheck(this, SpatialMeanOperator);

    var _this18 = _possibleConstructorReturn(this, _DataNode3.call(this, operands));

    _this18.name = 'Spatial Mean';
    _this18.arity = 1;

    if (operands.length != _this18.arity) {
      throw Error('SpatialMeanOperator takes exactly ' + _this18.arity + ' operand');
    }

    _this18.operand = treeToNode(operands[0]);

    _this18.dimensions = 'time';
    return _this18;
  }

  SpatialMeanOperator.prototype.json = function json() {
    return ['smean', [this.operand.json()]];
  };

  return SpatialMeanOperator;
}(DataNode);

var SelectOperator = function (_DataNode4) {
  _inherits(SelectOperator, _DataNode4);

  function SelectOperator(operands) {
    _classCallCheck(this, SelectOperator);

    var _this19 = _possibleConstructorReturn(this, _DataNode4.call(this, operands));

    _this19.name = 'Select';
    _this19.arity = 2;

    if (operands.length != _this19.arity) {
      throw Error('SelectOperator takes exactly ' + _this19.arity + ' operands');
    }

    _this19.left = treeToNode(operands[0]);
    _this19.child_op = operands[0][0];
    _this19.right = operands[1];

    _this19.dimensions = _this19.left.dimensions;
    return _this19;
  }

  SelectOperator.prototype.json = function json() {
    return ['select', [this.left.json(), this.right.json()]];
  };

  return SelectOperator;
}(DataNode);

var ExpressionOperator = function (_DataNode5) {
  _inherits(ExpressionOperator, _DataNode5);

  function ExpressionOperator(operands) {
    _classCallCheck(this, ExpressionOperator);

    var _this20 = _possibleConstructorReturn(this, _DataNode5.call(this, operands));

    _this20.name = 'Expression';
    _this20.arity = 1;

    if (operands.length != _this20.arity) {
      throw Error('"ExpressionOperator takes exactly ' + _this20.arity + ' operand');
    }

    _this20.operand = treeToNode(operands[0]);

    _this20.dimensions = _this20.operand.dimensions;
    return _this20;
  }

  ExpressionOperator.prototype.json = function json() {
    return ['expression', [this.operand.json()]];
  };

  return ExpressionOperator;
}(DataNode);

var JoinOperator = function (_DataNode6) {
  _inherits(JoinOperator, _DataNode6);

  function JoinOperator(operands) {
    _classCallCheck(this, JoinOperator);

    var _this21 = _possibleConstructorReturn(this, _DataNode6.call(this, operands));

    _this21.name = 'Join';
    _this21.arity = 2;

    if (operands.length != _this21.arity) {
      throw Error('JoinOperator takes exactly ' + _this21.arity + ' operands');
    }

    _this21.left = new SourceOperator([operands[0]]);
    _this21.right = new SourceOperator([operands[1]]);

    var dimensions = new Set();
    dimensions.add(_this21.left.dimensions);
    dimensions.add(_this21.right.dimensions);

    _this21.dimensions = '';
    if (dimensions.has('space')) {
      _this21.dimensions += 'space';
    }
    if (dimensions.has('time')) {
      _this21.dimensions += 'time';
    }
    return _this21;
  }

  JoinOperator.prototype.json = function json() {
    return ['join', [this.left.json(), this.right.json()]];
  };

  return JoinOperator;
}(DataNode);

var RasterOperator = function (_DataNode7) {
  _inherits(RasterOperator, _DataNode7);

  function RasterOperator(operands) {
    _classCallCheck(this, RasterOperator);

    var _this22 = _possibleConstructorReturn(this, _DataNode7.call(this, operands));

    _this22.name = 'Raster';
    _this22.arity = 3;

    if (operands.length != _this22.arity) {
      throw Error('RasterOperator takes exactly ' + _this22.arity + ' operands');
    }

    _this22.left = operands[0];
    _this22.middle = operands[2];
    _this22.right = treeToNode(operands[1]);

    _this22.dimensions = 'spacetime';
    return _this22;
  }

  RasterOperator.prototype.json = function json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  };

  return RasterOperator;
}(DataNode);

var SourceOperator = function (_DataNode8) {
  _inherits(SourceOperator, _DataNode8);

  function SourceOperator(operands) {
    _classCallCheck(this, SourceOperator);

    var _this23 = _possibleConstructorReturn(this, _DataNode8.call(this, operands));

    _this23.name = 'Source';
    _this23.arity = 1;

    if (operands.length != _this23.arity) {
      throw Error('SourceOperator takes exactly ' + _this23.arity + ' operand');
    }

    _this23.operand = operands[0];
    _this23.source_name = _this23.operand.name;
    _this23.type = _this23.operand['type'];
    _this23.field = _this23.operand.field;

    if (_this23.type == 'Layer') {
      _this23.dimensions = 'space';
    } else if (_this23.type == 'Table') {
      _this23.dimensions = 'time';
    }
    return _this23;
  }

  SourceOperator.prototype.json = function json() {
    return ['source', [{ source_name: this.name, type: this.type, field: this.field }]];
  };

  return SourceOperator;
}(DataNode);

var MathOperator = function (_React$Component10) {
  _inherits(MathOperator, _React$Component10);

  function MathOperator(operator, operands) {
    _classCallCheck(this, MathOperator);

    var _this24 = _possibleConstructorReturn(this, _React$Component10.call(this, operands));

    _this24.operator = operator;
    _this24.name = operator;
    _this24.arity = 2;

    if (operands.length != _this24.arity) {
      throw Error('MathOperator takes exactly ' + _this24.arity + ' operands');
    }

    _this24.left = treeToNode(operands[0]);
    _this24.right = treeToNode(operands[1]);

    if (_this24.left.dimensions != _this24.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    _this24.dimensions = _this24.left.dimensions;
    return _this24;
  }

  MathOperator.prototype.json = function json() {
    return [this.operator, [this.left.json(), this.right.json()]];
  };

  return MathOperator;
}(React.Component);

var EmptyTree = function (_DataNode9) {
  _inherits(EmptyTree, _DataNode9);

  function EmptyTree(props) {
    _classCallCheck(this, EmptyTree);

    var _this25 = _possibleConstructorReturn(this, _DataNode9.call(this, props));

    _this25.name = 'Empty';
    _this25.arity = 0;
    return _this25;
  }

  EmptyTree.prototype.render = function render() {
    return null;
  };

  return EmptyTree;
}(DataNode);

function treeToNode(tree) {
  var node;

  if (!tree || Object.keys(tree).length == 0) {
    return new EmptyTree();
  }

  switch (tree[0]) {
    case 'mean':
      return new MeanOperator(tree[1]);
    case 'tmean':
      return new TemporalMeanOperator(tree[1]);
    case 'smean':
      return new SpatialMeanOperator(tree[1]);
    case 'select':
      return new SelectOperator(tree[1]);
    case 'expression':
      return new ExpressionOperator(tree[1]);
    case 'join':
      return new JoinOperator(tree[1]);
    case 'raster':
      return new RasterOperator(tree[1]);
    case 'source':
      return new SourceOperator(tree[1]);
    case '+':
    case '-':
    case '*':
    case '/':
      return new MathOperator(tree[0], tree[1]);
    default:
      throw Error("'" + tree[0] + "' is not a valid operator");
  }
}

var Sieve = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(SieveComponent);

function sieve(el) {
  var store = Redux.createStore(sieveApp, Redux.applyMiddleware(ReduxThunk.default));

  store.dispatch(fetchLayers());
  store.dispatch(fetchTables());
  store.dispatch(fetchVariables());
  store.dispatch(receiveRasterCatalog(raster_catalog));

  ReactDOM.render(React.createElement(ReactRedux.Provider, {
    children: React.createElement(Sieve, sieve_props),
    store: store
  }), el);
}

// Since this script is pulled in as 'text/babel', other scripts will go ahead and run
// even if this one isn't finished. This provides a reliable way to know when it has
// finished and to access its exports.
var sieve_defined = new CustomEvent('sievedefined', {
  detail: { sieve: sieve }
});
document.dispatchEvent(sieve_defined);

//# sourceMappingURL=sieve.js.map
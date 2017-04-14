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
      url: '/api/layers',
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
      url: '/api/tables',
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
  console.log(raster);
  var range = raster[1][2];

  if (range.includes("undefined")) return "Start and end date must be specified.";
  if (!range.match(/\d{4}-\d{3},\d{4}-\d{3}/g)) return "Date must be entered in the form yyyy-ddd";

  return null;
}

function addInputVariable(variable) {
  var node = variable.node;
  var inputType = node[0];
  var error = null;

  if (inputType == 'raster') {
    error = validateRaster(node);
  }
  console.log("Error in action: ", error);
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
  var errors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { "name": null, "tree": null };

  return {
    type: UPDATE_ERRORS,
    errors: errors
  };
}

function updateModified() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  return {
    type: UPDATE_MODIFIED,
    time: time
  };
}

function updateCreated() {
  var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
          "\xA0x\xA0"
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    name: 'Layers',
    isFetching: false,
    didInvalidate: false,
    items: []
  };
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    name: 'Tables',
    isFetching: false,
    didInvalidate: false,
    items: []
  };
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    items: []
  };
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    name: 'Variables',
    isFetching: false,
    didInvalidate: false,
    items: []
  };
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
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
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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

  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];

  switch (action.type) {
    case CHANGE_OPERAND_SELECTION:
      return Object.assign({}, state, (_Object$assign = {}, _Object$assign[action.id] = action.value, _Object$assign));
  }
}
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ReactBootstrap = ReactBootstrap,
    Panel = _ReactBootstrap.Panel,
    ButtonGroup = _ReactBootstrap.ButtonGroup,
    ButtonToolbar = _ReactBootstrap.ButtonToolbar,
    ButtonInput = _ReactBootstrap.ButtonInput,
    Button = _ReactBootstrap.Button,
    Row = _ReactBootstrap.Row,
    Col = _ReactBootstrap.Col,
    Alert = _ReactBootstrap.Alert,
    Tabs = _ReactBootstrap.Tabs,
    DropdownButton = _ReactBootstrap.DropdownButton,
    MenuItem = _ReactBootstrap.MenuItem,
    Table = _ReactBootstrap.Table,
    Modal = _ReactBootstrap.Modal,
    FormControl = _ReactBootstrap.FormControl,
    ControlLabel = _ReactBootstrap.ControlLabel,
    FormGroup = _ReactBootstrap.FormGroup,
    HelpBlock = _ReactBootstrap.HelpBlock;

/* app */

var initialState = Object.assign({
  errors: { "name": null, "tree": null },
  name: "",
  tree: {},
  description: "",
  spatialDomain: null,
  temporalDomain: { start: null, end: null },
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  editingTabularData: {},
  editingRasterData: {},
  editingExpressionData: {},
  operandSelections: {}
}, window.sieve_props);

function sieveApp() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
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
        input_variables: input_variables(state.input_variables, action)
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
    case EDIT_RASTER_DATA:
      return Object.assign({}, state, {
        editingRasterData: action.data
      });
    case EDIT_TABULAR_DATA:
      return Object.assign({}, state, {
        editingTabularData: action.data
      });
    case EDIT_EXPRESSION_DATA:
      return Ojectassign({}, state, {
        editingExpressionData: action.data
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
var DropdownComponent = function DropdownComponent(_ref) {
  var things = _ref.things,
      onclick = _ref.onclick;
  return (
    // TODO something different when layers.isFetching

    React.createElement(
      DropdownButton,
      { title: things.name, id: "form-var-dropdown" },
      things.items.map(function (item, i) {
        return item.field_names ? item.field_names.map(function (field, j) {
          return React.createElement(
            MenuItem,
            {
              key: "" + j + i,
              eventKey: "" + j + i,
              onClick: function onClick() {
                return onclick(things.tovar(item.name, field));
              }
            },
            field + "/" + item.name
          );
        }) : null;
      })
    )
  );
};

DropdownComponent.propTypes = {
  onclick: React.PropTypes.func.isRequired,
  things: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired
};

var VariableButtonGroup = function (_React$Component) {
  _inherits(VariableButtonGroup, _React$Component);

  function VariableButtonGroup() {
    _classCallCheck(this, VariableButtonGroup);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  /*static propTypes = {
    onclick: React.PropTypes.func.isRequired;
    variables: React.PropTypes.arrayOf(React.PropTypes.shape({
    name: React.PropTypes.number.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired).isRequired*/

  VariableButtonGroup.prototype.render = function render() {
    var _this2 = this;

    var join = null;
    return React.createElement(
      ButtonGroup,
      null,
      this.props.variables.map(function (things, i) {
        return React.createElement(DropdownComponent, {
          things: things,
          onclick: function onclick(token) {
            _this2.props.dispatch(insertToken(token));
          },
          key: i
        });
      })
    );
  };

  return VariableButtonGroup;
}(React.Component);

//  layer or table item to bare dict option


var i2o = function i2o(type, item, i) {
  return function (item, i) {
    if (item.field_names) {
      return item.field_names.map(function (field, j) {
        return React.createElement(
          "option",
          { value: "{\"type\":\"" + type + "\",\"name\":\"" + item.name + "\",\"id\":" + item.id + ",\"field\":\"" + field + "\"}" },
          item.name + "/" + field
        );
      });
    }
  };
};

var AddDataInputModal = function (_React$Component2) {
  _inherits(AddDataInputModal, _React$Component2);

  function AddDataInputModal(props) {
    _classCallCheck(this, AddDataInputModal);

    var _this3 = _possibleConstructorReturn(this, _React$Component2.call(this, props));

    _this3.validate = function (e) {
      var form = $(_this3.form).serializeArray();
      if (form[0]['value'] && form[1]['value'] && form[2]['value']) {
        var variable = {
          name: form[2]['value'],
          node: ['join', [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]]
        };
        _this3.setState({
          variable: variable
        });
      }
    };

    _this3.state = { showModal: false, variable: null };
    return _this3;
  }

  AddDataInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddDataInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddDataInputModal.prototype.use = function use() {
    this.props.onAddInputVariable(this.state.variable);
    this.setState({ showModal: false });
  };

  AddDataInputModal.prototype.render = function render() {
    var _this4 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref2) {
                _this4.form = _ref2;
              }, onChange: this.validate.bind(this) },
            React.createElement(
              FormGroup,
              { controlId: "leftSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Left"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "left" },
                this.props.layers.items.map(i2o('Layer')).concat(this.props.tables.items.map(i2o('Table')))
              )
            ),
            React.createElement(
              FormGroup,
              { controlId: "rightSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Right"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "right" },
                this.props.layers.items.map(i2o('Layer')).concat(this.props.tables.items.map(i2o('Table')))
              )
            ),
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          this.state.variable ? React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ) : null,
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddDataInputModal;
}(React.Component);

var AddRasterInputModal = function (_React$Component3) {
  _inherits(AddRasterInputModal, _React$Component3);

  function AddRasterInputModal(props) {
    _classCallCheck(this, AddRasterInputModal);

    var _this5 = _possibleConstructorReturn(this, _React$Component3.call(this, props));

    _this5.validate = function (e) {
      var form = $(_this5.form).serializeArray();
      if (form[0]['value'] && form[1]['value'] && form[2]['value'] && form[3]['value']) {
        var variable = {
          name: form[3]['value'],
          node: ['raster', [JSON.parse(form[0]['value']), JSON.parse(form[1]['value']), form[2]['value']]]
        };
        _this5.setState({
          variable: variable
        });
      }
    };

    _this5.state = { showModal: false, variable: null };
    return _this5;
  }

  AddRasterInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddRasterInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddRasterInputModal.prototype.use = function use() {
    this.props.onAddInputVariable(this.state.variable);
    this.setState({ showModal: false });
  };

  AddRasterInputModal.prototype.render = function render() {
    var _this6 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Raster Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref3) {
                _this6.form = _ref3;
              }, onChange: this.validate.bind(this) },
            React.createElement(
              FormGroup,
              { controlId: "rightSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Raster"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "right" },
                this.props.raster_catalog.items.map(function (r, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: "{\"name\": \"" + r.description + "\", \"id\": \"" + r.name + "\"}" },
                    r.description + ': ' + r.band
                  );
                })
              )
            ),
            React.createElement(
              FormGroup,
              { controlId: "leftSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Spatial\xA0Layer"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "left" },
                this.props.layers.items.map(function (v, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: "[\"source\", [{\"type\": \"Layer\", \"name\": \"" + v.name + "\", \"id\": \"" + v.id + "\", \"field\": \"shaid\"}]]" },
                    v.name ? v.name : rendertree(v)
                  );
                })
              )
            ),
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Temporal\xA0Range"
              ),
              React.createElement("input", {
                name: "dates", type: "text", placeholder: "enter like 2000-001,2000-31"
              })
            ),
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          this.state.variable ? React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ) : null,
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddRasterInputModal;
}(React.Component);

var AddExpressionInputModal = function (_React$Component4) {
  _inherits(AddExpressionInputModal, _React$Component4);

  function AddExpressionInputModal(props) {
    _classCallCheck(this, AddExpressionInputModal);

    var _this7 = _possibleConstructorReturn(this, _React$Component4.call(this, props));

    _this7.state = { showModal: false };
    return _this7;
  }

  AddExpressionInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddExpressionInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddExpressionInputModal.prototype.use = function use() {
    var form = $(this.form).serializeArray();
    var variable = {
      node: ['expression', [JSON.parse(form[1]['value'])]],
      name: form[0]['value']
    };
    this.props.onAddInputVariable(variable);
    this.setState({ showModal: false });
  };

  AddExpressionInputModal.prototype.render = function render() {
    var _this8 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref4) {
                _this8.form = _ref4;
              } },
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            ),
            React.createElement(
              FormGroup,
              { controlId: "numericText" },
              React.createElement(
                ControlLabel,
                null,
                "Expression"
              ),
              React.createElement(FormControl, { componentClass: "textarea", placeholder: "type number, like '1'", name: "numericText" })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddExpressionInputModal;
}(React.Component);

var AddSelectInputModal = function (_React$Component5) {
  _inherits(AddSelectInputModal, _React$Component5);

  function AddSelectInputModal(props) {
    _classCallCheck(this, AddSelectInputModal);

    var _this9 = _possibleConstructorReturn(this, _React$Component5.call(this, props));

    _this9.onSelectNode = function (select_node) {
      _this9.setState({ select_node: select_node });
    };

    _this9.state = {
      showModal: false,
      select_node: null
    };
    return _this9;
  }

  AddSelectInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddSelectInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddSelectInputModal.prototype.use = function use() {
    if (this.state.select_node) {
      var form = $(this.form).serializeArray();
      var variable = {
        node: this.state.select_node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddSelectInputModal.prototype.render = function render() {
    var _this10 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(SelectForm, _extends({ onSelectNode: this.onSelectNode }, this.props)),
          React.createElement(
            "form",
            { ref: function ref(_ref5) {
                _this10.form = _ref5;
              } },
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddSelectInputModal;
}(React.Component);

var AddLayerInputModal = function (_React$Component6) {
  _inherits(AddLayerInputModal, _React$Component6);

  function AddLayerInputModal(props) {
    _classCallCheck(this, AddLayerInputModal);

    var _this11 = _possibleConstructorReturn(this, _React$Component6.call(this, props));

    _this11.onSelectNode = function (node) {
      _this11.setState({ node: node });
    };

    _this11.state = {
      showModal: false,
      node: null
    };
    return _this11;
  }

  AddLayerInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddLayerInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddLayerInputModal.prototype.use = function use() {
    if (this.state.node) {
      this.props.onAddTreeOp(this.state.node);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddLayerInputModal.prototype.use = function use() {
    if (this.state.node) {
      var form = $(this.form).serializeArray();
      console.log(this.state.node);
      var variable = {
        node: this.state.node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddLayerInputModal.prototype.render = function render() {
    var _this12 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Layer Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(SelectLayerForm, _extends({ onSelectNode: this.onSelectNode }, this.props)),
          React.createElement(
            "form",
            { ref: function ref(_ref6) {
                _this12.form = _ref6;
              } },
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Add"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddLayerInputModal;
}(React.Component);

var AddTableInputModal = function (_React$Component7) {
  _inherits(AddTableInputModal, _React$Component7);

  function AddTableInputModal(props) {
    _classCallCheck(this, AddTableInputModal);

    var _this13 = _possibleConstructorReturn(this, _React$Component7.call(this, props));

    _this13.onSelectNode = function (node) {
      _this13.setState({ node: node });
    };

    _this13.state = {
      showModal: false,
      node: null
    };
    return _this13;
  }

  AddTableInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddTableInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddTableInputModal.prototype.use = function use() {
    if (this.state.node) {
      var form = $(this.form).serializeArray();
      var variable = {
        node: this.state.node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddTableInputModal.prototype.render = function render() {
    var _this14 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : "Add Input",
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Table Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(SelectTableForm, _extends({ onSelectNode: this.onSelectNode }, this.props)),
          React.createElement(
            "form",
            { ref: function ref(_ref7) {
                _this14.form = _ref7;
              } },
            React.createElement(
              FormGroup,
              { controlId: "name" },
              React.createElement(
                ControlLabel,
                null,
                "Name"
              ),
              React.createElement(FormControl, {
                name: "name", type: "text", placeholder: "enter variable name"
              })
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Add"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddTableInputModal;
}(React.Component);

var AddBinOpModal = function (_React$Component8) {
  _inherits(AddBinOpModal, _React$Component8);

  function AddBinOpModal(props) {
    _classCallCheck(this, AddBinOpModal);

    var _this15 = _possibleConstructorReturn(this, _React$Component8.call(this, props));

    _this15.state = { showModal: false };
    return _this15;
  }

  AddBinOpModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddBinOpModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddBinOpModal.prototype.use = function use() {
    var form = $(this.form).serializeArray();
    var variable = [this.props.op, [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]];
    this.props.onAddTreeOp(variable);
    this.setState({ showModal: false });
  };

  AddBinOpModal.prototype.render = function render() {
    var _this16 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : this.props.op,
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Binary Operation"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref8) {
                _this16.form = _ref8;
              } },
            React.createElement(
              FormGroup,
              { controlId: "leftSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Left operand"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "left" },
                this.props.input_variables.map(function (v, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: JSON.stringify(v.node) },
                    v.name ? v.name : rendertree(v)
                  );
                }),
                React.createElement(
                  "option",
                  {
                    key: this.props.input_variables.length,
                    value: JSON.stringify(this.props.tree) },
                  "Current tree"
                )
              )
            ),
            React.createElement(
              FormGroup,
              { controlId: "rightSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Right operand"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "right" },
                React.createElement(
                  "option",
                  {
                    key: this.props.input_variables.length,
                    value: JSON.stringify(this.props.tree) },
                  "Current tree"
                ),
                this.props.input_variables.map(function (v, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: JSON.stringify(v.node) },
                    v.name ? v.name : rendertree(v)
                  );
                })
              )
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Operation"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddBinOpModal;
}(React.Component);

var AddUnaryOpModal = function (_React$Component9) {
  _inherits(AddUnaryOpModal, _React$Component9);

  function AddUnaryOpModal(props) {
    _classCallCheck(this, AddUnaryOpModal);

    var _this17 = _possibleConstructorReturn(this, _React$Component9.call(this, props));

    _this17.state = { showModal: false };
    return _this17;
  }

  AddUnaryOpModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddUnaryOpModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddUnaryOpModal.prototype.use = function use() {
    var form = $(this.form).serializeArray();
    var variable = [this.props.op, [JSON.parse(form[0]['value'])]];
    this.props.onAddTreeOp(variable);
    this.setState({ showModal: false });
  };

  AddUnaryOpModal.prototype.render = function render() {
    var _this18 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : this.props.op,
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Adding Binary Operation"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref9) {
                _this18.form = _ref9;
              } },
            React.createElement(
              FormGroup,
              { controlId: "leftSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Left operand"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "left" },
                this.props.input_variables.map(function (v, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: JSON.stringify(v.node) },
                    v.name ? v.name : treeToNode(v).html(0)
                  );
                }),
                React.createElement(
                  "option",
                  {
                    key: this.props.input_variables.length,
                    value: JSON.stringify(this.props.tree) },
                  "tree"
                )
              )
            )
          )
        ),
        React.createElement(
          Modal.Footer,
          null,
          React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Operation"
          ),
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddUnaryOpModal;
}(React.Component);

var AddSelectModal = function (_React$Component10) {
  _inherits(AddSelectModal, _React$Component10);

  function AddSelectModal(props) {
    _classCallCheck(this, AddSelectModal);

    var _this19 = _possibleConstructorReturn(this, _React$Component10.call(this, props));

    _this19.onSelectNode = function (select_node) {
      _this19.setState({ select_node: select_node });
    };

    _this19.state = {
      showModal: false,
      select_node: null
    };
    return _this19;
  }

  AddSelectModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddSelectModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddSelectModal.prototype.use = function use() {
    if (this.state.select_node) {
      this.props.onAddTreeOp(this.state.select_node);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddSelectModal.prototype.render = function render() {
    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : this.props.op,
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Select Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(SelectForm, _extends({ onSelectNode: this.onSelectNode }, this.props))
        ),
        React.createElement(
          Modal.Footer,
          null,
          this.state.select_node ? React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ) : null,
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddSelectModal;
}(React.Component);

var AddMeanModal = function (_React$Component11) {
  _inherits(AddMeanModal, _React$Component11);

  function AddMeanModal(props) {
    _classCallCheck(this, AddMeanModal);

    var _this20 = _possibleConstructorReturn(this, _React$Component11.call(this, props));

    _this20.onSelectNode = function (node) {
      _this20.setState({ node: node });
    };

    _this20.state = {
      showModal: false,
      node: null
    };
    return _this20;
  }

  AddMeanModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddMeanModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddMeanModal.prototype.use = function use() {
    if (this.state.node) {
      var form = $(this.form).serializeArray();
      var right = JSON.parse(form[0]['value']);

      var mean_node = ['mean', [this.state.node, right]];
      this.props.onAddTreeOp(mean_node);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddMeanModal.prototype.render = function render() {
    var _this21 = this;

    return React.createElement(
      Button,
      {
        bsStyle: "primary",
        onClick: this.open.bind(this)
      },
      this.props.children ? this.props.children : this.props.op,
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Mean Operation"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref10) {
                _this21.form = _ref10;
              } },
            React.createElement(
              FormGroup,
              { controlId: "rightSelect" },
              React.createElement(
                ControlLabel,
                null,
                "Right operand"
              ),
              React.createElement(
                FormControl,
                { componentClass: "select", placeholder: "select", name: "right" },
                React.createElement(
                  "option",
                  {
                    key: this.props.input_variables.length,
                    value: JSON.stringify(this.props.tree) },
                  "tree"
                ),
                this.props.input_variables.map(function (v, i) {
                  return React.createElement(
                    "option",
                    { key: i, value: JSON.stringify(v.node) },
                    v.name ? v.name : treeToNode(v).html(0)
                  );
                })
              )
            )
          ),
          React.createElement(SelectForm, _extends({ onSelectNode: this.onSelectNode }, this.props))
        ),
        React.createElement(
          Modal.Footer,
          null,
          this.state.node ? React.createElement(
            Button,
            { onClick: this.use.bind(this) },
            "Use Variable"
          ) : null,
          React.createElement(
            Button,
            { onClick: this.close.bind(this) },
            "Close"
          )
        )
      )
    );
  };

  return AddMeanModal;
}(React.Component);

var SelectForm = function (_React$Component12) {
  _inherits(SelectForm, _React$Component12);

  function SelectForm(props) {
    _classCallCheck(this, SelectForm);

    var _this22 = _possibleConstructorReturn(this, _React$Component12.call(this, props));

    _this22.onVariableChange = function (e) {
      if (e.target.value) {
        var v = JSON.parse(e.target.value);
        if (v[0] == 'select') {
          _this22.props.onSelectNode(v);
          _this22.setState({ variable: v });
        } else {
          _this22.setState({ select_variable: v });
        }
      }
    };

    _this22.onPropertyChange = function (e) {
      //this.setState({select_property: JSON.parse(e.target.value)});
      if (e.target.value) {
        var node = ['select', [_this22.state.select_variable, JSON.parse(e.target.value)]];
        _this22.props.onSelectNode(node);
      }
    };

    _this22.state = {
      variable: null,
      select_variable: null,
      select_property: null
    };
    return _this22;
  }

  SelectForm.prototype.render = function render() {
    var _this23 = this;

    var property = null;
    if (this.state.select_variable) {
      if (this.state.select_variable[0] == 'join') {
        var of_variable = function of_variable(_type) {
          return function (item) {
            return _this23.state.select_variable[1][0]['type'] == _type && _this23.state.select_variable[1][0]['id'] == item['id'] || _this23.state.select_variable[1][1]['type'] == _type && _this23.state.select_variable[1][1]['id'] == item['id'];
          };
        };
        var options = this.props.layers.items.filter(of_variable('Layer')).map(i2o('Layer')).concat(this.props.tables.items.filter(of_variable('Table')).map(i2o('Table')));
        property = React.createElement(
          FormGroup,
          { controlId: "rightSelect" },
          React.createElement(
            ControlLabel,
            null,
            "Variable\xA0Property"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              name: "right",
              onChange: this.onPropertyChange.bind(this) },
            React.createElement(
              "option",
              { key: 9999, value: null },
              "Not Selected"
            ),
            options
          )
        );
      } else if (this.state.select_variable[0] == 'source') {
        var _of_variable = function _of_variable(_type) {
          return function (item) {
            return _this23.state.select_variable[1][0]['type'] == _type && _this23.state.select_variable[1][0]['id'] == item['id'];
          };
        };
        var options = this.props.layers.items.filter(_of_variable('Layer')).map(i2o('Layer')).concat(this.props.tables.items.filter(_of_variable('Table')).map(i2o('Table')));
        property = React.createElement(
          FormGroup,
          { controlId: "rightSelect" },
          React.createElement(
            ControlLabel,
            null,
            "Variable\xA0Property"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              name: "right",
              onChange: this.onPropertyChange.bind(this) },
            React.createElement(
              "option",
              { key: 9999, value: null },
              "Not Selected"
            ),
            options
          )
        );
      } else if (this.state.select_variable[0] == 'raster') {
        var options = [['mean', 'Mean'], ['maximum', 'Maximum'], ['minimum', 'Minimum'], ['skew', 'Skew'], ['sd', 'Standard Deviation']].map(function (o, i) {
          return React.createElement(
            "option",
            { key: i, value: '{"name": "raster", "field": "' + o[0] + '"}' },
            o[1]
          );
        });
        property = React.createElement(
          FormGroup,
          { controlId: "rightSelect" },
          React.createElement(
            ControlLabel,
            null,
            "Variable\xA0Property"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              name: "right",
              onChange: this.onPropertyChange.bind(this) },
            React.createElement(
              "option",
              { key: 9999, value: null },
              "Not Selected"
            ),
            options
          )
        );
      }
    }

    return React.createElement(
      "form",
      { ref: function ref(_ref11) {
          _this23.form = _ref11;
        } },
      React.createElement(
        FormGroup,
        { controlId: "leftSelect" },
        React.createElement(
          ControlLabel,
          null,
          "Input\xA0Variable"
        ),
        React.createElement(
          FormControl,
          {
            componentClass: "select",
            placeholder: "select",
            name: "left",
            onChange: this.onVariableChange.bind(this) },
          React.createElement(
            "option",
            { key: 9999, value: null },
            "Not Selected"
          ),
          this.props.input_variables.map(function (v, i) {
            return React.createElement(
              "option",
              { key: i, value: JSON.stringify(v.node) },
              v.name ? v.name : treeToNode(v).html(0)
            );
          })
        )
      ),
      property
    );
  };

  return SelectForm;
}(React.Component);

var SelectLayerForm = function (_React$Component13) {
  _inherits(SelectLayerForm, _React$Component13);

  function SelectLayerForm(props) {
    _classCallCheck(this, SelectLayerForm);

    var _this24 = _possibleConstructorReturn(this, _React$Component13.call(this, props));

    _this24.onVariableChange = function (e) {
      if (e.target.value) {
        var v = JSON.parse(e.target.value);
        _this24.props.onSelectNode(v);
      }
    };

    _this24.state = {
      variable: null
    };
    return _this24;
  }

  SelectLayerForm.prototype.render = function render() {
    var _this25 = this;

    var property = null;
    return React.createElement(
      "form",
      { ref: function ref(_ref12) {
          _this25.form = _ref12;
        } },
      React.createElement(
        FormGroup,
        { controlId: "leftSelect" },
        React.createElement(
          ControlLabel,
          null,
          "Spatial\xA0Layer"
        ),
        React.createElement(
          FormControl,
          {
            componentClass: "select",
            placeholder: "select",
            name: "left",
            onChange: this.onVariableChange.bind(this) },
          React.createElement(
            "option",
            { key: 9999, value: null },
            "Not Selected"
          ),
          this.props.layers.items.map(function (v, i) {
            return React.createElement(
              "option",
              { key: i, value: "[\"source\", [{\"type\": \"Layer\", \"name\": \"" + v.name + "\", \"id\": " + v.id + ", \"field\": \"shaid\"}]]" },
              v.name ? v.name : treeToNode(v).html(0)
            );
          })
        )
      ),
      property
    );
  };

  return SelectLayerForm;
}(React.Component);

var SelectTableForm = function (_React$Component14) {
  _inherits(SelectTableForm, _React$Component14);

  function SelectTableForm(props) {
    _classCallCheck(this, SelectTableForm);

    var _this26 = _possibleConstructorReturn(this, _React$Component14.call(this, props));

    _this26.onVariableChange = function (e) {
      if (e.target.value) {
        var v = JSON.parse(e.target.value);
        _this26.props.onSelectNode(v);
      }
    };

    _this26.state = {
      variable: null
    };
    return _this26;
  }

  SelectTableForm.prototype.render = function render() {
    var _this27 = this;

    var property = null;
    return React.createElement(
      "form",
      { ref: function ref(_ref13) {
          _this27.form = _ref13;
        } },
      React.createElement(
        FormGroup,
        { controlId: "leftSelect" },
        React.createElement(
          ControlLabel,
          null,
          "Tabular\xA0Layer"
        ),
        React.createElement(
          FormControl,
          {
            componentClass: "select",
            placeholder: "select",
            name: "left",
            onChange: this.onVariableChange.bind(this) },
          React.createElement(
            "option",
            { key: 9999, value: null },
            "Not Selected"
          ),
          this.props.tables.items.map(function (v, i) {
            return React.createElement(
              "option",
              { key: i, value: "[\"source\", [{\"type\": \"Table\", \"name\": \"" + v.name + "\", \"id\": " + v.id + "}]]" },
              v.name ? v.name : treeToNode(v).html(0)
            );
          })
        )
      ),
      property
    );
  };

  return SelectTableForm;
}(React.Component);

var SpatialConfiguration = function (_React$Component15) {
  _inherits(SpatialConfiguration, _React$Component15);

  function SpatialConfiguration() {
    _classCallCheck(this, SpatialConfiguration);

    return _possibleConstructorReturn(this, _React$Component15.apply(this, arguments));
  }

  SpatialConfiguration.prototype.componentDidMount = function componentDidMount() {
    var map = this.map = L.map('spatial-config-map').setView([0, 0], 2);

    this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'ags.n5m0p5ci',
      accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
    }).addTo(map);
  };

  SpatialConfiguration.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    var _this29 = this;

    if (prevProps.spatialDomain != this.props.spatialDomain) {
      if (this.geoJsonTileLayer) this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatialDomain) {
        var geoJsonURL = '/layers/' + this.props.spatialDomain + '/{z}/{x}/{y}.json';
        this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
          clipTiles: true,
          unique: function unique(feature) {
            return feature.properties.id;
          }
        }, {
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

        $.ajax('/api/layers/' + this.props.spatialDomain, {
          dataType: 'json',
          success: function success(data, status, xhr) {
            var bounds = [[data['bounds'][1], data['bounds'][0]], [data['bounds'][3], data['bounds'][2]]];
            _this29.map.fitBounds(bounds);
          }
        });
      }
    }
  };

  SpatialConfiguration.prototype.render = function render() {
    var layer_options = this.props.layers.items.map(function (layer) {
      return { value: layer.id, label: layer.name };
    });

    return React.createElement(
      Panel,
      { header: "Spatial configuration" },
      React.createElement(Select, { value: this.props.spatialDomain, options: layer_options,
        onChange: this.props.onSpatialDomainChange }),
      React.createElement("div", { id: "spatial-config-map", style: { height: 400, marginTop: 10 } })
    );
  };

  return SpatialConfiguration;
}(React.Component);

var TabularDataSource = function (_React$Component16) {
  _inherits(TabularDataSource, _React$Component16);

  function TabularDataSource() {
    _classCallCheck(this, TabularDataSource);

    return _possibleConstructorReturn(this, _React$Component16.apply(this, arguments));
  }

  TabularDataSource.prototype.onSave = function onSave() {
    if (this.props.errors.tabularDataName) return; // Do not submit if there are errors
    var name = this.props.editingTabularData.name;
    if (name == null || name.length == 0) {
      name = this.props.editingTabularData.defaultName;
    }

    var variable = {
      name: name,
      node: ['join', [this.props.editingTabularData.source1, this.props.editingTabularData.source2]]
    };
    var index = this.props.editingTabularData.index;
    var isEditing = this.props.editingTabularData.isEditing;

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
  };

  TabularDataSource.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.editingTabularData.defaultName || newProps.input_variables != this.props.input_variables) {
      var t1 = newProps.tables.items[0];
      if (t1) {
        var source1 = { name: t1.name, field: t1.field_names[0] };
        var source2 = Object.assign({}, source1);
        var name = this.generateName(source1, source2, newProps.input_variables);
        var data = Object.assign({}, newProps.editingTabularData, { defaultName: name });

        if (!this.props.editingTabularData.source1) data.source1 = source1;
        if (!this.props.editingTabularData.source2) data.source2 = source2;

        this.props.onEditTabularData(data);
      }
    }
  };

  TabularDataSource.prototype.generateName = function generateName(source1, source2) {
    var var_list = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (source1.name == source2.name) {
      var name = source1.name + '-' + source1.field + '-' + source2.field;
    } else {
      var name = source1.name + '-' + source2.name;
    }

    var i = 1;
    var unique = false;
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

    var data = Object.assign({}, this.props.editingTabularData, {
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
    var _this31 = this;

    return React.createElement(
      Panel,
      { header: "Tabular data" },
      React.createElement(
        "form",
        { ref: function ref(_ref14) {
            _this31.form = _ref14;
          }, onChange: this.validate.bind(this) },
        React.createElement(
          FormGroup,
          { controlId: "formSelectSource" },
          React.createElement(
            ControlLabel,
            null,
            "Source 1"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              value: this.sourceToString(this.props.editingTabularData.source1),
              name: "table"
            },
            this.props.tables.items.map(i2o('Table')).concat(this.props.layers.items.map(i2o('Layer')))
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: "formSelectDest" },
          React.createElement(
            ControlLabel,
            null,
            "Source 2"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              name: "layer",
              value: this.sourceToString(this.props.editingTabularData.source2)
            },
            this.props.tables.items.map(i2o('Table')).concat(this.props.layers.items.map(i2o('Layer')))
          )
        ),
        React.createElement(
          FormGroup,
          {
            validationState: this.props.errors.tabularDataName ? 'error' : null,
            controlId: "name" },
          React.createElement(
            ControlLabel,
            null,
            "Name"
          ),
          React.createElement(FormControl, {
            name: "name", type: "text",
            placeholder: this.props.editingTabularData.defaultName,
            value: this.props.editingTabularData.name
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
          "Add"
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

var RasterDataSource = function (_React$Component17) {
  _inherits(RasterDataSource, _React$Component17);

  function RasterDataSource() {
    _classCallCheck(this, RasterDataSource);

    return _possibleConstructorReturn(this, _React$Component17.apply(this, arguments));
  }

  RasterDataSource.prototype.onSave = function onSave() {
    if (this.props.errors.rasterDataName || this.props.errors.rasterDate) return; // Do not submit if there are errors

    var name = this.props.editingRasterData.name;
    if (name == null || name.length == 0) {
      name = this.props.editingRasterData.defaultName;
    }

    var variable = {
      name: name,
      node: ['raster', [this.props.editingRasterData.raster, this.props.spatialDomain, this.props.editingRasterData.temporalRangeStart + ',' + this.props.editingRasterData.temporalRangeEnd]]
    };
    var index = this.props.editingRasterData.index;
    var isEditing = this.props.editingRasterData.isEditing;

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
  };

  RasterDataSource.prototype.sourceToString = function sourceToString(source) {
    return JSON.stringify(source);
  };

  RasterDataSource.prototype.generateName = function generateName(raster) {
    var var_list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var name = raster.id;
    var i = 1;

    var unique = false;
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
    var _this33 = this;

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
      _this33.validate();
    });

    $(this.endpicker).datepicker({
      format: format
    }).on("changeDate", function (e) {
      _this33.validate();
    });
  };

  RasterDataSource.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.editingRasterData.defaultName || newProps.input_variables != this.props.input_variables) {
      var raster = newProps.raster_catalog.items[0];
      var raster2 = Object.assign({}, raster, { id: raster.name });
      var name = this.generateName(raster2, newProps.input_variables);
      var data = Object.assign({}, newProps.editingRasterData, { defaultName: name });
      if (!this.props.editingRasterData.raster) data.raster = raster;
      this.props.onEditRasterData(data);
    }
  };

  RasterDataSource.prototype.updateDefaultName = function updateDefaultName() {
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if (!name || name.length < 1) {
      var raster = JSON.parse(form[0]['value']);
      var data = Object.assign({}, this.props.editingRasterData, { defaultName: this.generateName(raster) });
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

    var data = Object.assign({}, this.props.editingRasterData, {
      name: name,
      raster: raster,
      temporalRangeStart: temporalRangeStart,
      temporalRangeEnd: temporalRangeEnd,
      defaultName: defaultName
    });

    this.props.onEditRasterData(data);
  };

  RasterDataSource.prototype.render = function render() {
    var _this34 = this;

    return React.createElement(
      Panel,
      { header: "Raster data" },
      React.createElement(
        "form",
        { ref: function ref(_ref17) {
            _this34.form = _ref17;
          }, onChange: this.validate.bind(this) },
        React.createElement(
          FormGroup,
          { controlId: "rightSelect" },
          React.createElement(
            ControlLabel,
            null,
            "Raster"
          ),
          React.createElement(
            FormControl,
            {
              componentClass: "select",
              placeholder: "select",
              name: "right",
              value: this.sourceToString(this.props.editingRasterData.raster)
            },
            this.props.raster_catalog.items.map(function (r, i) {
              return React.createElement(
                "option",
                { key: i, value: "{\"name\":\"" + r.description + "\",\"id\":\"" + r.name + "\"}" },
                r.description + ': ' + r.band
              );
            })
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: "range",
            validationState: this.props.errors.rasterDataTemporalRange ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            "Temporal\xA0Range"
          ),
          React.createElement(
            "div",
            { "class": "input-group input-daterange" },
            React.createElement("input", {
              ref: function ref(_ref15) {
                _this34.startpicker = _ref15;
              },
              name: "temporalRangeStart", type: "text", placeholder: "yyyy-ddd",
              value: this.props.editingRasterData.temporalRangeStart
            }),
            React.createElement(
              "span",
              { "class": "input-group-addon" },
              "to"
            ),
            React.createElement("input", {
              ref: function ref(_ref16) {
                _this34.endpicker = _ref16;
              },
              name: "temporalRangeEnd", type: "text", placeholder: "yyyy-ddd",
              value: this.props.editingRasterData.temporalRangeEnd
            })
          ),
          React.createElement(
            HelpBlock,
            null,
            this.props.errors.rasterDataTemporalRange ? this.props.errors.rasterDataTemporalRange : "Date must be entered in the form yyyy-ddd"
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: "name",
            validationState: this.props.errors.rasterDataName ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            "Name"
          ),
          React.createElement(FormControl, {
            name: "name", type: "text",
            placeholder: this.props.editingRasterData.defaultName,
            value: this.props.editingRasterData.name
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
          "Add"
        )
      )
    );
  };

  return RasterDataSource;
}(React.Component);

var ExpressionEditor = function (_React$Component18) {
  _inherits(ExpressionEditor, _React$Component18);

  function ExpressionEditor() {
    _classCallCheck(this, ExpressionEditor);

    return _possibleConstructorReturn(this, _React$Component18.apply(this, arguments));
  }

  ExpressionEditor.prototype.render = function render() {
    if (this.props.tree[0]) {
      var RootNode = treeToNode(this.props.tree[0]);
    } else {
      var RootNode = EmptyTree;
    }
    return React.createElement(
      Panel,
      { header: "Expression editor" },
      React.createElement(
        FormGroup,
        { controlId: "name" },
        React.createElement(FormControl, { componentClass: "input",
          placeholder: "Name...",
          onChange: this.changeName,
          value: this.props.editingExpressionData.name })
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(
          "div",
          { className: "pull-right" },
          React.createElement(
            ButtonGroup,
            null,
            React.createElement(
              Button,
              { onClick: this.props.onInitTree.bind(this, ['+', [EMPTY, EMPTY]]) },
              "+"
            ),
            React.createElement(
              Button,
              null,
              "-"
            ),
            React.createElement(
              Button,
              null,
              "*"
            ),
            React.createElement(
              Button,
              null,
              "/"
            ),
            React.createElement(
              Button,
              null,
              "Temporal Mean"
            ),
            React.createElement(
              Button,
              null,
              "Spatial Mean"
            )
          )
        )
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(RootNode, { input_variables: this.props.input_variables,
          tree: this.props.tree, node_id: 0,
          onEditTreeNode: this.props.onEditTreeNode,
          onChangeOperandSelection: this.props.onChangeOperandSelection,
          operandSelections: this.props.operandSelections })
      ),
      React.createElement(
        Button,
        null,
        "Add"
      )
    );
  };

  return ExpressionEditor;
}(React.Component);

var VariableTable = function (_React$Component19) {
  _inherits(VariableTable, _React$Component19);

  function VariableTable() {
    _classCallCheck(this, VariableTable);

    return _possibleConstructorReturn(this, _React$Component19.apply(this, arguments));
  }

  VariableTable.prototype.onUseVariable = function onUseVariable(variable) {
    this.props.onInitTree(variable.node);
  };

  VariableTable.prototype.render = function render() {
    var _this37 = this;

    if (this.props.input_variables.length > 0) {
      var item = this.props.input_variables[0];
    }
    return React.createElement(
      Panel,
      { header: "Variables" },
      React.createElement(
        Table,
        { striped: true },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "th",
              null,
              "Name"
            ),
            React.createElement(
              "th",
              null,
              "Type"
            ),
            React.createElement(
              "th",
              null,
              "Dimensions"
            )
          )
        ),
        React.createElement(
          "tbody",
          null,
          this.props.input_variables.map(function (item, i) {
            var type = item.node[0];
            var operator = treeToNode(item.node);
            return React.createElement(
              "tr",
              null,
              React.createElement(
                "td",
                null,
                item.name
              ),
              React.createElement(
                "td",
                null,
                item.node[0]
              ),
              React.createElement(
                "td",
                null,
                operator.dimensions
              ),
              React.createElement(
                "td",
                null,
                React.createElement(
                  Button,
                  { onClick: _this37.onUseVariable.bind(_this37, item) },
                  "Use"
                ),
                React.createElement(
                  Button,
                  {
                    onClick: function onClick() {
                      if (item.node[0] == "join") {
                        var source1 = item.node[1][0];
                        var source2 = item.node[1][1];
                        _this37.props.onEditTabularData({
                          name: item.name,
                          source1: source1,
                          source2: source2,
                          isEditing: true,
                          index: i
                        });
                      } else if (item.node[0] == "raster") {
                        var raster = item.node[1][0];
                        var temporalRangeStart = item.node[1][2];
                        var temporalRangeEnd = item.node[1][3];
                        _this37.props.onSpatialDomainChange({ value: item.node[1][1] });
                        _this37.props.onEditRasterData({
                          name: item.name,
                          raster: raster,
                          temporalRangeStart: temporalRangeStart,
                          temporalRangeEnd: temporalRangeEnd,
                          isEditing: true,
                          index: i
                        });
                      }
                    } },
                  "Edit"
                )
              ),
              React.createElement(
                "td",
                null,
                React.createElement(
                  Button,
                  {
                    onClick: function onClick() {
                      _this37.props.onRemoveInputVariable(i);
                    } },
                  "Delete"
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

var SieveComponent = function (_React$Component20) {
  _inherits(SieveComponent, _React$Component20);

  function SieveComponent() {
    _classCallCheck(this, SieveComponent);

    return _possibleConstructorReturn(this, _React$Component20.apply(this, arguments));
  }

  SieveComponent.prototype.render = function render() {
    var self = this;

    function createMarkup() {
      return { __html: treeToNode(self.props.tree).html(0) };
    };
    function returnHTML(html) {
      return { __html: html };
    };

    var onSave = function onSave(e) {
      e.stopPropagation();
      if (self.props.errors.name || self.props.errors.tree) {
        return;
      }
      self.props.onSaveVariable({
        id: self.props.id,
        name: self.props.name,
        tree: node2tree(self.props.tree),
        input_variables: self.props.input_variables,
        description: self.props.description,
        temporal_domain: self.props.temporal_domain,
        spatial_domain: self.props.spatial_domain
      }, self.props.created);
    };

    return React.createElement(
      "div",
      { className: "sieve" },
      React.createElement(
        Row,
        { className: "show-grid" },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(SpatialConfiguration, this.props)
        )
      ),
      React.createElement(
        Row,
        { className: "show-grid" },
        React.createElement(
          Col,
          { xs: 5 },
          React.createElement(TabularDataSource, this.props)
        ),
        React.createElement(
          Col,
          { xs: 5, xsOffset: 1 },
          React.createElement(RasterDataSource, this.props)
        )
      ),
      React.createElement(
        Row,
        { className: "show-grid" },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(ExpressionEditor, this.props)
        )
      ),
      React.createElement(
        Row,
        { className: "show-grid" },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(VariableTable, this.props)
        )
      ),
      React.createElement(
        Button,
        { onClick: onSave },
        "Save"
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

var OperandChooser = function (_React$Component21) {
  _inherits(OperandChooser, _React$Component21);

  function OperandChooser() {
    _classCallCheck(this, OperandChooser);

    return _possibleConstructorReturn(this, _React$Component21.apply(this, arguments));
  }

  OperandChooser.prototype.onChangeOperand = function onChangeOperand(e) {
    this.props.onEditTreeNode(this.props.node_id, this.props.operandToNode(e.value));
  };

  OperandChooser.prototype.render = function render() {
    var Component;

    if (this.props.editable) {
      Component = Select.Creatable;
    } else {
      Component = Select;
    }
    return React.createElement(
      "div",
      { style: { display: "inline-block", width: 100 } },
      React.createElement(Component, { onChange: this.onChangeOperand.bind(this),
        value: this.props.value,
        options: this.props.operands,
        clearable: false })
    );
  };

  return OperandChooser;
}(React.Component);

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

    var _this40 = _possibleConstructorReturn(this, _DataNode.call(this, operands));

    if (operands.length != 2) {
      throw Error("MeanOperator takes exactly 2 operands");
    }

    _this40.left = treeToNode(operands[0]);
    _this40.right = treeToNode(operands[1]);

    if (_this40.left.dimensions != _this40.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    _this40.dimensions = _this40.left.dimensions;
    return _this40;
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

    var _this41 = _possibleConstructorReturn(this, _DataNode2.call(this, operands));

    if (operands.length != 1) {
      throw Error("TemporalMeanOperator takes exactly 1 operand");
    }

    _this41.operand = treeToNode(operands[0]);

    _this41.dimensions = 'space';
    return _this41;
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

    var _this42 = _possibleConstructorReturn(this, _DataNode3.call(this, operands));

    if (operands.length != 1) {
      throw Error("SpatialMeanOperator takes exactly 1 operand");
    }

    _this42.operand = treeToNode(operands[0]);

    _this42.dimensions = 'time';
    return _this42;
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

    var _this43 = _possibleConstructorReturn(this, _DataNode4.call(this, operands));

    if (operands.length != 2) {
      throw Error("SelectOperator takes exactly 2 operands");
    }

    _this43.left = treeToNode(operands[0]);
    _this43.child_op = operands[0][0];
    _this43.right = operands[1];

    _this43.dimensions = _this43.left.dimensions;
    return _this43;
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

    var _this44 = _possibleConstructorReturn(this, _DataNode5.call(this, operands));

    if (operands.length != 1) {
      throw Error("ExpressionOperator takes exactly 1 operand");
    }

    _this44.operand = treeToNode(operands[0]);

    _this44.dimensions = _this44.operand.dimensions;
    return _this44;
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

    var _this45 = _possibleConstructorReturn(this, _DataNode6.call(this, operands));

    if (operands.length != 2) {
      throw Error("JoinOperator takes exactly 2 operands");
    }

    _this45.left = new SourceOperator([operands[0]]);
    _this45.right = new SourceOperator([operands[1]]);

    var dimensions = new Set();
    dimensions.add(_this45.left.dimensions);
    dimensions.add(_this45.right.dimensions);

    _this45.dimensions = '';
    if (dimensions.has('space')) {
      _this45.dimensions += 'space';
    }
    if (dimensions.has('time')) {
      _this45.dimensions += 'time';
    }
    return _this45;
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

    var _this46 = _possibleConstructorReturn(this, _DataNode7.call(this, operands));

    if (operands.length != 3) {
      throw Error("RasterOperator takes exactly 3 operands");
    }

    _this46.left = operands[0];
    _this46.middle = operands[2];
    _this46.right = treeToNode(operands[1]);

    _this46.dimensions = 'spacetime';
    return _this46;
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

    var _this47 = _possibleConstructorReturn(this, _DataNode8.call(this, operands));

    if (operands.length != 1) {
      throw Error("SourceOperator takes exactly 1 operand");
    }

    _this47.operand = operands[0];
    _this47.name = _this47.operand.name;
    _this47.type = _this47.operand['type'];
    _this47.field = _this47.operand.field;

    if (_this47.type == 'Layer') {
      _this47.dimensions = 'space';
    } else if (_this47.type == 'Table') {
      _this47.dimensions = 'time';
    }
    return _this47;
  }

  SourceOperator.prototype.json = function json() {
    return ['source', [{ name: this.name, type: this.type, field: this.field }]];
  };

  return SourceOperator;
}(DataNode);

var MathOperator = function (_React$Component22) {
  _inherits(MathOperator, _React$Component22);

  function MathOperator(operator, operands) {
    _classCallCheck(this, MathOperator);

    var _this48 = _possibleConstructorReturn(this, _React$Component22.call(this, operands));

    _this48.operator = operator;

    if (operands.length != 2) {
      throw Error("MathOperator takes exactly 2 operands");
    }

    _this48.left = treeToNode(operands[0]);
    _this48.right = treeToNode(operands[1]);

    if (_this48.left.dimensions != _this48.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    _this48.dimensions = _this48.left.dimensions;
    return _this48;
  }

  MathOperator.prototype.json = function json() {
    return [this.operator, [this.left.json(), this.right.json()]];
  };

  return MathOperator;
}(React.Component);

var EmptyTree = function (_React$Component23) {
  _inherits(EmptyTree, _React$Component23);

  function EmptyTree(props) {
    _classCallCheck(this, EmptyTree);

    return _possibleConstructorReturn(this, _React$Component23.call(this, props));
  }

  EmptyTree.prototype.render = function render() {
    return null;
  };

  return EmptyTree;
}(React.Component);

function treeToNode(tree) {
  var node;

  if (Object.keys(tree).length == 0) {
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
      return new MathOperator(tree[1]);
    default:
      throw Error("'" + tree[0] + "' is not a valid operator");
  }
}

var TreeView = function (_React$Component24) {
  _inherits(TreeView, _React$Component24);

  function TreeView() {
    _classCallCheck(this, TreeView);

    return _possibleConstructorReturn(this, _React$Component24.apply(this, arguments));
  }

  TreeView.prototype.render = function render() {
    return React.createElement(
      "span",
      null,
      rendertree(this.props.children)
    );
  };

  return TreeView;
}(React.Component);

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
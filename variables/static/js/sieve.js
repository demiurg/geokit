'use strict';

var REQUEST_LAYERS = 'REQUEST_LAYERS';
var RECEIVE_LAYERS = 'RECEIVE_LAYERS';

var REQUEST_TABLES = 'REQUEST_TABLES';
var RECEIVE_TABLES = 'RECEIVE_TABLES';

var RECEIVE_RASTER_CATALOG = 'RECEIVE_RASTER_CATALOG';

var RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
var REQUEST_VARIABLES = 'REQUEST_VARIABLES';

var RECEIVE_INPUT_VARIABLES = 'RECEIVE_INPUT_VARIABLES';

var UPDATE_NAME = 'UPDATE_NAME';
var UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
var UPDATE_SPATIAL_DOMAIN = 'UPDATE_SPATIAL_DOMAIN';
var UPDATE_TREE = 'UPDATE_TREE';
var UPDATE_ERRORS = 'UPDATE_ERRORS';
var UPDATE_MODIFIED = 'UPDATE_MODIFIED';
var UPDATE_CREATED = 'UPDATE_CREATED';

var REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
var ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';
var UPDATE_INPUT_VARIABLE = 'UPDATE_INPUT_VARIABLE';
var ERROR_INPUT_VARIABLE = 'ERROR_INPUT_VARIABLE';

var INIT_TREE = 'INIT_TREE';
var EDIT_TREE_NODE = 'EDIT_TREE_NODE';

var CHANGE_OPERAND_SELECTION = 'CHANGE_OPERAND_SELECTION';

var SAVE_VARIABLE = 'SAVE_VARIABLE';
var POST_VARIABLE = 'POST_VARIABLE';
var RECIEVE_VARIABLE = 'RECIEVE_VARIABLE';

var EDIT_NODE = 'EDIT_NODE';

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

function receiveInputVariables(input_variables) {
  if (!input_variables) {
    return {
      type: RECEIVE_INPUT_VARIABLES,
      input_variables: [],
      spatial_domain: null
    };
  } else {
    var last_input_var = null;
    var spatial_domain = null;
    var input_nodes = Array(input_variables.length);
    for (var i = input_variables.length - 1; i >= 0; i--) {
      var ivnode = treeToNode(input_variables[i]);
      input_nodes[i] = ivnode;
      if (!spatial_domain) {
        var layers = ivnode.layers;
        if (layers.length > 0) {
          spatial_domain = layers[layers.length - 1].operand.id;
        }
      }
    }
    return {
      type: RECEIVE_INPUT_VARIABLES,
      input_variables: input_nodes,
      spatial_domain: spatial_domain
    };
  }
}

function addInputVariable(node) {
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
      variable: node
    };
  } else {
    return {
      type: ADD_INPUT_VARIABLE,
      error: error,
      field: "rasterDataTemporalRange",
      id: nextVariableId++,
      variable: node
    };
  }
}

function editInputVariable(node, i) {
  var name = null;

  if (node.type == 'named') {
    name = node.name_operand;
    node = node.value;
  }

  return function (dispatch) {
    if (node.type == "join") {
      dispatch(updateTabularData({
        name: name,
        errors: {},
        layer_field: node.left.operand.field,
        table: node.right.operand.id,
        table_field: node.right.operand.field,
        editing: true,
        valid: true,
        index: i
      }));
    } else if (node.type == "raster") {
      dispatch(updateSpatialDomain(node.layer.id));
      dispatch(updateRasterData({
        name: name,
        raster: node,
        product: node.product,
        date_start: node.start,
        date_end: node.end,
        date_range: node.range,
        editing: true,
        index: i,
        valid: true,
        errors: {}
      }));
    } else {
      var Cls = DataNode.Class(node.type);
      dispatch(updateExpressionData({
        name: name,
        index: i,
        editing: true,
        node_class: DataNode.Class(node.type),
        node: node,
        op: node.type,
        operand_refs: null,
        valid: true,
        errors: {}
      }));
    }
  };
}

function updateInputVariable(variable, idx) {
  return {
    type: UPDATE_INPUT_VARIABLE,
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

function updateTree(tree) {
  return {
    type: UPDATE_TREE,
    tree: tree
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

function updateTabularData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_TABULAR_DATA,
    data: data
  };
}

function updateRasterData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_RASTER_DATA,
    data: data
  };
}

function updateExpressionData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_EXPRESSION,
    data: data
  };
}

function addDataSource() {
  return {
    type: EDIT_NODE,
    mode: ADDING_DATA_SOURCE,
    data: {}
  };
}

function addExpression() {
  return {
    type: EDIT_NODE,
    mode: EDITING_EXPRESSION,
    data: {}
  };
}

function editNothing() {
  return {
    type: EDIT_NODE,
    mode: DEFAULT,
    data: {}
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
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OperandChooser = function (_React$Component) {
  _inherits(OperandChooser, _React$Component);

  function OperandChooser(props) {
    _classCallCheck(this, OperandChooser);

    return _possibleConstructorReturn(this, _React$Component.call(this, props));
  }

  OperandChooser.prototype.changeOperand = function changeOperand(e) {
    var operand_refs = this.props.node_editor.expression_data.operand_refs;

    var operand_ref = e ? e.value : null;
    operand_refs[this.props.operand_index] = operand_ref;

    var data = Object.assign({}, this.props.node_editor.expression_data, {
      operand_refs: operand_refs,
      valid: operand_refs.reduce(function (acc, val) {
        return acc && val;
      })
    });
    this.props.onUpdateExpressionData(data);
  };

  OperandChooser.prototype.changeNumeric = function changeNumeric(e) {
    var data = Object.assign({}, this.props.node_editor.expression_data, {
      numeric_operand: Number.parseFloat(e.target.value),
      valid: e.target.value
    });
    this.props.onUpdateExpressionData(data);
  };

  OperandChooser.prototype.options = function options() {
    var data = this.props.node_editor.expression_data;

    var valid_input_vars = data.node_class.validOperands(this.props.input_variables, data.operand_refs, this.props.operand_index);

    return valid_input_vars.map(function (input_var) {
      return { value: input_var.name, label: input_var.name };
    });
  };

  OperandChooser.prototype.render = function render() {
    var _this2 = this;

    var data = this.props.node_editor.expression_data;

    if (data.op == 'numeric') {
      return React.createElement("input", { type: "number", value: data.numeric_operand, onChange: function onChange(e) {
          return _this2.changeNumeric(e);
        } });
    } else if (data.operand_refs) {
      return React.createElement(
        "div",
        { style: { display: "inline-block", width: 400 } },
        React.createElement(Select, {
          onChange: function onChange(e) {
            return _this2.changeOperand(e);
          },
          value: data.operand_refs[this.props.operand_index],
          options: this.options(),
          clearable: true
        })
      );
    } else {
      return null;
    }
  };

  return OperandChooser;
}(React.Component);

var TreeViewer = function (_React$Component2) {
  _inherits(TreeViewer, _React$Component2);

  function TreeViewer() {
    _classCallCheck(this, TreeViewer);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  TreeViewer.prototype.render = function render() {
    var data = this.props.node_editor.expression_data;

    if (!data.node_class) {
      return React.createElement(
        "p",
        null,
        "Select operation above."
      );
    }

    var operand_inputs = [];
    for (var i = 0; i < data.node_class.arity; i++) {
      operand_inputs.push(React.createElement(OperandChooser, _extends({}, this.props, { operand_index: i })));
    }

    return React.createElement(
      "span",
      null,
      data.op,
      " ( ",
      React.createElement(
        "blockquote",
        null,
        operand_inputs
      ),
      " )"
    );
  };

  return TreeViewer;
}(React.Component);

var ExpressionEditor = function (_React$Component3) {
  _inherits(ExpressionEditor, _React$Component3);

  function ExpressionEditor(props) {
    _classCallCheck(this, ExpressionEditor);

    var _this4 = _possibleConstructorReturn(this, _React$Component3.call(this, props));

    var data = _this4.props.node_editor.expression_data;

    if (data.op == 'numeric') {
      _this4.props.onUpdateExpressionData(Object.assign({}, data, {
        default_name: _this4.generateName(props.input_variables),
        numeric_operand: data.node.operand
      }));
    } else {
      var operand_refs = [];
      if (data.operand_refs == null && data.node) {
        var operands = data.node.operands();
        for (var _iterator = operands, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var onode = _ref;

          for (var i = 0; i < _this4.props.input_variables.length; i++) {
            if (onode.isEquivalent(_this4.props.input_variables[i].value)) {
              operand_refs.push(_this4.props.input_variables[i].name_operand);
              if (operand_refs.length == data.node_class.arity) {
                break;
              }
            }
          }
        }
      }

      _this4.props.onUpdateExpressionData(Object.assign({}, data, {
        default_name: _this4.generateName(props.input_variables),
        operand_refs: data.operand_refs ? data.operand_refs : operand_refs,
        valid: data.node_class && operand_refs.length == data.node_class.arity
      }));
    }
    return _this4;
  }

  ExpressionEditor.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    if (!newProps.node_editor.expression_data.default_name || newProps.input_variables != this.props.input_variables) {
      this.props.onUpdateExpressionData(Object.assign({}, this.props.node_editor.expression_data, { default_name: this.generateName(newProps.input_variables) }));
    }
  };

  ExpressionEditor.prototype.generateName = function generateName() {
    var var_list = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

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
    var data = this.props.node_editor.expression_data;
    var errors = {};
    var name = e.target.value;

    if (name && name.length > 0 && !name.match(/^[a-zA-Z0-9-]+$/)) {
      errors['name'] = "Name must be alphanumeric, without spaces.";
    } else {
      var names = this.props.input_variables.map(function (v) {
        return v.name_operand;
      });
      var i = names.indexOf(name);
      if (i > -1 && !(data.editing && data.index == i)) {
        errors['name'] = "Name must not alread be used.";
      }
    }
    var data = Object.assign({}, data, { name: name, errors: errors, valid: Object.keys(errors).length == 0 });
    this.props.onUpdateExpressionData(data);
  };

  ExpressionEditor.prototype.addOp = function addOp(op) {
    var node_class = DataNode.Class(op);
    var expression_data = Object.assign({}, this.props.node_editor.expression_data, { op: op, operand_refs: Array(node_class.arity), node_class: node_class });
    this.props.onUpdateExpressionData(expression_data);
  };

  ExpressionEditor.prototype.onSave = function onSave() {
    var data = this.props.node_editor.expression_data;

    if (data.op == 'numeric') {
      var rands = [data.numeric_operand];
    } else {
      var rands = [];
      for (var _iterator2 = data.operand_refs, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var name = _ref2;

        for (var _iterator3 = this.props.input_variables, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
          var _ref3;

          if (_isArray3) {
            if (_i3 >= _iterator3.length) break;
            _ref3 = _iterator3[_i3++];
          } else {
            _i3 = _iterator3.next();
            if (_i3.done) break;
            _ref3 = _i3.value;
          }

          var ivar = _ref3;

          if (name == ivar.name) {
            // access named operand value here, throwing away name
            rands.push(ivar.value);
            break; // Just in case names are not unique now, this needs validation
          }
        }
      }
    }

    var node = new data.node_class([data.op, rands]);
    if (!data.name || data.name == "") {
      data.name = data.default_name;
    }

    node = DataNode.nameNode(data.name, node);

    this.props.onUpdateExpressionData(data);
    this.props.onAddInputVariable(node);
    this.props.onEditNothing();
  };

  ExpressionEditor.prototype.render = function render() {
    var _this5 = this;

    var data = this.props.node_editor.expression_data;

    return React.createElement(
      Panel,
      { header: "Expression editor" },
      React.createElement(
        FormGroup,
        { controlId: "name" },
        React.createElement(FormControl, { componentClass: "input",
          placeholder: data.default_name,
          onChange: function onChange(e) {
            return _this5.changeName(e);
          },
          value: data.name })
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
              { onClick: function onClick(e) {
                  return _this5.addOp('+');
                } },
              "+"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('-');
                } },
              "-"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('*');
                } },
              "*"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('/');
                } },
              "/"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('mean');
                } },
              "Arithmetic Mean"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('tmean');
                } },
              "Temporal Mean"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('smean');
                } },
              "Spatial Mean"
            ),
            React.createElement(
              Button,
              { onClick: function onClick(e) {
                  return _this5.addOp('numeric');
                } },
              "Numeric"
            )
          )
        )
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(TreeViewer, this.props)
      ),
      data.valid ? React.createElement(
        Button,
        { onClick: this.onSave.bind(this) },
        "Add"
      ) : null,
      React.createElement(
        Button,
        { onClick: this.props.onEditNothing },
        "Cancel"
      )
    );
  };

  return ExpressionEditor;
}(React.Component);
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var RasterProductTable = function (_React$Component) {
  _inherits(RasterProductTable, _React$Component);

  function RasterProductTable() {
    _classCallCheck(this, RasterProductTable);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  RasterProductTable.prototype.generateName = function generateName(id) {
    var var_list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var name = id.replace(/_/g, "-");
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

  RasterProductTable.prototype.selectRaster = function selectRaster(raster) {
    var dname = this.generateName(raster.name, this.props.input_variables);
    var data = Object.assign({}, this.props.node_editor.raster_data, {
      default_name: dname,
      raster: raster,
      product: { id: raster.name, name: raster.description }
    });
    this.props.onUpdateRasterData(data);
  };

  RasterProductTable.prototype.render = function render() {
    var _this2 = this;

    var raster = this.props.node_editor.raster_data.raster ? raster : false;

    if (!this.props.raster_catalog) {
      return React.createElement(
        "p",
        null,
        "Raster catalog is temporarily unavailable."
      );
    }

    return React.createElement(
      "div",
      { className: "row" },
      React.createElement(
        Table,
        { className: "table-fixed", striped: true },
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(
              "th",
              { className: "col-xs-3" },
              "Description"
            ),
            React.createElement(
              "th",
              { className: "col-xs-1" },
              "Driver"
            ),
            React.createElement(
              "th",
              { className: "col-xs-2" },
              "Product"
            ),
            React.createElement(
              "th",
              { className: "col-xs-2" },
              "Available From"
            ),
            React.createElement(
              "th",
              { className: "col-xs-2" },
              "Available To"
            ),
            React.createElement(
              "th",
              { className: "col-xs-2" },
              "Select"
            )
          )
        ),
        React.createElement(
          "tbody",
          null,
          this.props.raster_catalog.items.map(function (r, i) {
            return React.createElement(
              "tr",
              {
                key: i,
                className: raster && raster.id == r.id ? 'active' : ''
              },
              React.createElement(
                "td",
                { className: "col-xs-3", style: { 'clear': 'both' } },
                r.description
              ),
              React.createElement(
                "td",
                { className: "col-xs-1" },
                r.driver
              ),
              React.createElement(
                "td",
                { className: "col-xs-2" },
                r.product
              ),
              React.createElement(
                "td",
                { className: "col-xs-2" },
                r.start_date
              ),
              React.createElement(
                "td",
                { className: "col-xs-2" },
                r.end_date
              ),
              React.createElement(
                "td",
                { className: "col-xs-2" },
                React.createElement(
                  Button,
                  {
                    onClick: function onClick(e) {
                      return _this2.selectRaster(r);
                    } },
                  raster && raster.id == r.id ? 'Selected' : 'Select'
                )
              )
            );
          })
        )
      )
    );
  };

  return RasterProductTable;
}(React.Component);

var RasterDataSource = function (_React$Component2) {
  _inherits(RasterDataSource, _React$Component2);

  function RasterDataSource() {
    _classCallCheck(this, RasterDataSource);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  RasterDataSource.prototype.onSave = function onSave() {
    if (!this.props.node_editor.raster_data.valid) {
      return; // Do not submit if there are errors
    }
    var data = this.props.node_editor.raster_data;

    var name = data.name;
    if (name == null || name.length == 0) {
      name = data.default_name;
    }

    var layer = { type: 'Layer', id: this.props.spatial_domain, field: 'fid' };
    for (var _iterator = this.props.layers.items, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var input_layer = _ref;

      if (input_layer.id == layer.id) {
        layer['name'] = input_layer['name'];
        break;
      }
    }

    var variable = ['named', [name, ['raster', [data.product, ['source', [layer]], data.date_range]]]];

    variable = DataNode.toNode(variable);

    if (data.editing) {
      this.props.onUpdateInputVariable(variable, data.index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateRasterData();
    this.props.onEditNothing();
  };

  RasterDataSource.prototype.sourceToString = function sourceToString(source) {
    return JSON.stringify(source);
  };

  RasterDataSource.prototype.mountCalendars = function mountCalendars() {
    var _this4 = this;

    var self = this;
    var cal_format = {
      toDisplay: function toDisplay(date, format, language) {
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        var d = new Date(date.getTime() + userTimezoneOffset);
        return dateToDOY(d);
      },
      toValue: function toValue(date, format, language) {
        if (!/\d{4}-\d{3}/g.test(date)) {
          return null;
        }
        return RasterOperator.julianToDate(date);
      }
    };

    //var r = self.props.node_editor.raster_data.raster;
    // console.log('update', r.start_date, r.end_date);

    var r = this.props.raster_catalog.items.filter(function (raster) {
      return raster.name == _this4.props.node_editor.raster_data.product.id;
    })[0];

    //console.log(r, raster_info);

    $(self.startpicker).datepicker({
      'format': cal_format,
      'startDate': new Date(r.start_date),
      'endDate': new Date(r.end_date)
    }).on("changeDate", function (e) {
      self.onChange();
    });

    $(self.endpicker).datepicker({
      'format': cal_format,
      'startDate': new Date(r.start_date),
      'endDate': new Date(r.end_date)
    }).on("changeDate", function (e) {
      self.onChange();
    });
  };

  RasterDataSource.prototype.componentDidMount = function componentDidMount() {
    if (this.props.node_editor.raster_data.raster) {
      this.mountCalendars();
    }
  };

  RasterDataSource.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
    // If raster is set and if new raster is different than previous raster
    var self = this;
    if (self.props.node_editor.raster_data.raster && (!prevProps.node_editor.raster_data.raster || prevProps.node_editor.raster_data.raster.name != self.props.node_editor.raster_data.raster.name)) {
      self.mountCalendars();
    }
  };

  RasterDataSource.prototype.onChange = function onChange() {
    var _this5 = this;

    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    var date_start = form[1]['value'];
    var date_end = form[2]['value'];
    var range = date_start + ',' + date_end;

    var data = this.props.node_editor.raster_data;
    var raster = this.props.raster_catalog.items.filter(function (raster) {
      return raster.name == _this5.props.node_editor.raster_data.product.id;
    })[0];

    var raster_start_date = new Date(raster.start_date);
    var raster_end_date = new Date(raster.end_date);

    var errors = {};

    if (!date_start) {
      errors['date_start'] = "Start date is required. ";
    } else {
      if (!date_start.match(/\d{4}-\d{3}/g)) {
        errors['date_start'] = "Start date must be entered in the form yyyy-ddd. ";
      } else {
        var date_start_date = RasterOperator.julianToDate(date_start);
        if (date_start_date < raster_start_date) {
          errors['date_start'] = "Start date must be after " + raster_start_date.toDateString() + ". ";
        }
      }
    }

    if (!date_end) {
      errors['date_end'] = "End date is required. ";
    } else {
      if (!date_end.match(/\d{4}-\d{3}/g)) {
        errors['date_end'] = "End date must be entered in the form yyyy-ddd. ";
      } else {
        var date_end_date = RasterOperator.julianToDate(date_end);
        if (date_end_date > raster_end_date) {
          errors['date_end'] = "End date must be before " + raster_end_date.toDateString() + ". ";
        }

        if (date_start_date && date_start_date >= date_end_date) {
          errors['date_end'] = "End date must be after start date.";
        }
      }
    }

    if (name && name.length > 0 && !name.match(/^[a-zA-Z0-9-]+$/)) {
      errors['name'] = "Name must be alphanumeric, without spaces.";
    } else {
      var names = this.props.input_variables.map(function (v) {
        return v.name_operand;
      });
      var i = names.indexOf(name);
      if (i > -1 && !(data.editing && data.index == i)) {
        errors['name'] = "Name must not alread be used.";
      }
    }

    var data = Object.assign({}, this.props.node_editor.raster_data, {
      name: name,
      date_start: date_start,
      date_end: date_end,
      date_range: range,
      errors: errors,
      valid: Object.keys(errors) == 0
    });

    this.props.onUpdateRasterData(data);
  };

  RasterDataSource.prototype.render = function render() {
    var _this6 = this;

    var data = this.props.node_editor.raster_data;
    var product = data.product ? data.product : null;

    if (!product && !this.props.raster_catalog.items) {
      return React.createElement(
        Panel,
        { header: "Raster data" },
        "Temporarily unavailable"
      );
    }

    var date_error = (data.errors.date_range ? data.errors.date_range : "") + (data.errors.date_start ? data.errors.date_start : "") + (data.errors.date_end ? data.errors.date_end : "");

    return React.createElement(
      Panel,
      { header: "Raster data" },
      React.createElement(
        "form",
        { ref: function ref(_ref4) {
            return _this6.form = _ref4;
          }, onChange: function onChange() {
            return _this6.onChange();
          } },
        React.createElement(
          FormGroup,
          { controlId: "rightSelect" },
          React.createElement(
            ControlLabel,
            null,
            "Raster"
          ),
          React.createElement(RasterProductTable, this.props),
          React.createElement(FormControl, {
            name: "raster", type: "text", readOnly: true,
            placeholder: "Select raster product to use.",
            value: product ? product.name : null
          })
        ),
        product ? React.createElement(
          FormGroup,
          { controlId: "range",
            validationState: date_error ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            "Temporal\xA0Range"
          ),
          React.createElement(
            "div",
            { className: "input-group input-daterange" },
            React.createElement("input", {
              ref: function ref(_ref2) {
                _this6.startpicker = _ref2;
              },
              name: "date_start", type: "text", placeholder: "yyyy-ddd",
              value: data.date_start
            }),
            React.createElement(
              "span",
              { className: "input-group-addon" },
              "to"
            ),
            React.createElement("input", {
              ref: function ref(_ref3) {
                _this6.endpicker = _ref3;
              },
              name: "date_end", type: "text", placeholder: "yyyy-ddd",
              value: data.date_end
            })
          ),
          React.createElement(
            HelpBlock,
            null,
            date_error ? date_error : "Date must be entered in the form yyyy-ddd."
          )
        ) : null,
        React.createElement(
          FormGroup,
          { controlId: "name",
            validationState: data.errors.name ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            "Name"
          ),
          React.createElement(FormControl, {
            name: "name", type: "text",
            placeholder: data.default_name,
            value: data.name && data.name.length > 0 ? data.name : null
          }),
          React.createElement(
            HelpBlock,
            null,
            data.errors.name ? data.errors.name : "Name must be alphanumeric, without spaces."
          )
        ),
        data.valid ? React.createElement(
          Button,
          { onClick: function onClick() {
              return _this6.onSave();
            } },
          data.editing ? "Save" : "Add"
        ) : null,
        React.createElement(
          Button,
          { onClick: function onClick() {
              return _this6.props.onEditNothing();
            } },
          "Cancel"
        )
      )
    );
  };

  return RasterDataSource;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TabularDataSource = function (_React$Component) {
  _inherits(TabularDataSource, _React$Component);

  function TabularDataSource() {
    _classCallCheck(this, TabularDataSource);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  TabularDataSource.prototype.onSave = function onSave() {
    var data = this.props.node_editor.tabular_data;

    if (data.errors.name || data.errors.table || data.errors.layer_field || data.errors.table_field) return; // Do not submit if there are errors
    var name = data.name;
    if (name == null || name.length == 0) {
      name = data.default_name;
    }

    var variable = ['named', [name, ['join', [{ 'type': 'Layer', 'id': this.props.spatial_domain, 'field': data.layer_field }, { 'type': 'Table', 'id': data.table, 'field': data.table_field }]]]];
    var index = data.index;
    var editing = data.editing;

    variable = DataNode.toNode(variable);

    if (editing) {
      this.props.onUpdateInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateTabularData(null);
    this.props.onEditNothing();
  };

  TabularDataSource.prototype.componentWillReceiveProps = function componentWillReceiveProps(newProps) {
    var data = this.props.node_editor.tabular_data;
    if (!newProps.node_editor.tabular_data.default_name || newProps.input_variables != this.props.input_variables) {
      var t1 = newProps.tables.items[0];
      if (t1) {
        var source1 = { name: t1.name, field: t1.field_names[0] };
        var source2 = Object.assign({}, source1);
        var name = this.generateName(newProps.node_editor.tabular_data.table, newProps.input_variables);
        var data = Object.assign({}, newProps.node_editor.tabular_data, { default_name: name });

        if (!this.props.node_editor.tabular_data.source1) {
          data.source1 = source1;
        }
        if (!this.props.node_editor.tabular_data.source2) {
          data.source2 = source2;
        }
        this.props.onUpdateTabularData(data);
      }
    }
  };

  TabularDataSource.prototype.layerIdToName = function layerIdToName(layer_id) {
    return this.props.layers.items.filter(function (layer) {
      return layer.id == layer_id;
    })[0].name;
  };

  TabularDataSource.prototype.tableIdToName = function tableIdToName(table_id) {
    return this.props.tables.items.filter(function (table) {
      return table.id == table_id;
    })[0].name;
  };

  TabularDataSource.prototype.generateName = function generateName(table) {
    var var_list = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (table) {
      var name = this.layerIdToName(this.props.spatial_domain) + '-' + this.tableIdToName(table);
    } else {
      return this.layerIdToName(this.props.spatial_domain) + '-';
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

    var layer_field = form[0]['value'];
    var table = form[1]['value'];

    if (form.length == 4) {
      var table_field = form[2]['value'];
      var name = form[3]['value'];
    } else {
      var table_field = null;
      var name = form[2]['value'];
    }

    var default_name = this.generateName(table);

    var errors = {};
    if (!layer_field) {
      errors.layer_field = "Must select a layer field";
    }
    if (!table) {
      errors.table = "Must select a table";
    }
    if (!table_field) {
      errors.table_field = "Must select a table field";
    }

    var data = Object.assign({}, this.props.node_editor.tabular_data, {
      name: name,
      errors: errors,
      layer_field: layer_field,
      table: table,
      table_field: table_field,
      default_name: default_name
    });

    this.props.onUpdateTabularData(data);
  };

  TabularDataSource.prototype.sourceToString = function sourceToString(source) {
    return JSON.stringify(source);
  };

  TabularDataSource.prototype.render = function render() {
    var _this2 = this;

    var data = this.props.node_editor.tabular_data;

    return React.createElement(
      Panel,
      { header: 'Tabular data' },
      React.createElement(
        'form',
        { ref: function ref(_ref) {
            _this2.form = _ref;
          }, onChange: this.validate.bind(this) },
        React.createElement(
          FormGroup,
          { controlId: 'formSelectLayerField',
            validationState: data.errors.layer_field ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            'Layer Field'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              value: data.layer_field,
              name: 'layer-field'
            },
            React.createElement('option', { value: null }),
            this.props.layers.items.filter(function (layer) {
              return layer.id == _this2.props.spatial_domain;
            })[0].field_names.map(function (field) {
              return React.createElement(
                'option',
                { value: field },
                field
              );
            })
          )
        ),
        React.createElement(
          FormGroup,
          { controlId: 'formSelectTable',
            validationState: data.errors.table ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            'Table'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              name: 'table',
              value: data.table
            },
            React.createElement('option', { value: null }),
            this.props.tables.items.map(function (table) {
              return React.createElement(
                'option',
                { value: table.id },
                table.name
              );
            })
          )
        ),
        this.props.node_editor.tabular_data.table ? React.createElement(
          FormGroup,
          { controlId: 'formSelectTableField',
            validationState: data.errors.table_field ? 'error' : null },
          React.createElement(
            ControlLabel,
            null,
            'Table Field'
          ),
          React.createElement(
            FormControl,
            {
              componentClass: 'select',
              placeholder: 'select',
              value: data.table_field,
              name: 'table-field' },
            React.createElement('option', { value: null }),
            this.props.tables.items.filter(function (table) {
              return table.id == _this2.props.node_editor.tabular_data.table;
            })[0].field_names.map(function (field) {
              return React.createElement(
                'option',
                { value: field },
                field
              );
            })
          )
        ) : null,
        React.createElement(
          FormGroup,
          {
            validationState: data.errors.name ? 'error' : null,
            controlId: 'name' },
          React.createElement(
            ControlLabel,
            null,
            'Name'
          ),
          React.createElement(FormControl, {
            name: 'name', type: 'text',
            placeholder: data.default_name,
            value: data.name
          }),
          React.createElement(
            HelpBlock,
            null,
            data.errors.name ? data.errors.name : "Name must be alphanumeric, without spaces."
          )
        ),
        React.createElement(
          Button,
          { onClick: this.onSave.bind(this) },
          'Add'
        ),
        React.createElement(
          Button,
          { onClick: this.props.onEditNothing },
          'Cancel'
        )
      )
    );
  };

  return TabularDataSource;
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
    case UPDATE_INPUT_VARIABLE:
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
    default:
      return state;
  }
}

// Interface states
var DEFAULT = 'DEFAULT';
var ADDING_DATA_SOURCE = 'ADDING_DATA_SOURCE';
var EDITING_TABULAR_DATA = 'EDITING_TABULAR_DATA';
var EDITING_RASTER_DATA = 'EDITING_RASTER_DATA';
var EDITING_EXPRESSION = 'EDITING_EXPRESSION';

function node_editor() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { 'mode': DEFAULT };
  var action = arguments[1];

  switch (action.mode) {
    case ADDING_DATA_SOURCE:
      return Object.assign({}, state, {
        mode: action.mode
      });
    case EDITING_RASTER_DATA:
      return Object.assign({}, state, {
        mode: action.mode,
        raster_data: action.data ? action.data : {
          name: "",
          raster: false,
          product: false,
          date_start: "",
          data_end: "",
          editing: false,
          index: -1,
          default_name: null,
          valid: false,
          errors: {}
        }
      });
    case EDITING_TABULAR_DATA:
      return Object.assign({}, state, {
        mode: action.mode,
        tabular_data: action.data ? action.data : {
          name: "",
          layer_field: "",
          table: "",
          table_field: "",
          default_name: null,
          editing: false,
          index: -1,
          errors: {}
        }
      });
    case EDITING_EXPRESSION:
      return Object.assign({}, state, {
        mode: action.mode,
        expression_data: action.data ? action.data : {
          name: "",
          default_name: null,
          op: null,
          node_class: null,
          operand_refs: null,
          editing: false,
          valid: false
        }
      });
    case DEFAULT:
      return Object.assign({}, state, {
        mode: action.mode
      });
    default:
      return state;
  }
}
"use strict";

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
    Tab = _ReactBootstrap.Tab,
    DropdownButton = _ReactBootstrap.DropdownButton,
    MenuItem = _ReactBootstrap.MenuItem,
    Table = _ReactBootstrap.Table,
    Glyphicon = _ReactBootstrap.Glyphicon,
    Modal = _ReactBootstrap.Modal,
    FormControl = _ReactBootstrap.FormControl,
    ControlLabel = _ReactBootstrap.ControlLabel,
    FormGroup = _ReactBootstrap.FormGroup,
    HelpBlock = _ReactBootstrap.HelpBlock;

/* app */

var initialState = Object.assign({
  id: null,
  errors: { "name": null, "tree": null },
  name: "",
  tree: [],
  description: "",
  spatial_domain: null,
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  node_editor: { mode: DEFAULT },
  tabular_data: {},
  raster_data: {},
  expression_data: {},
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
    case RECEIVE_INPUT_VARIABLES:
      return Object.assign({}, state, {
        input_variables: action.input_variables,
        spatial_domain: action.spatial_domain
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
        spatial_domain: action.layer_id
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        changed: true,
        tree: action.tree.json ? action.tree.json : action.tree,
        errors: Object.assign({}, state.errors, { tree: action.error })
      });
    case UPDATE_ERRORS:
      return Object.assign({}, state, {
        errors: action.errors
      });
    case ADD_INPUT_VARIABLE:
    case REMOVE_INPUT_VARIABLE:
    case UPDATE_INPUT_VARIABLE:
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
    case EDIT_NODE:
      return Object.assign({}, state, {
        node_editor: node_editor(state.node_editor, action)
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
    onUpdateName: function onUpdateName(name, field) {
      dispatch(updateName(name, field));
    },
    onDescriptionChange: function onDescriptionChange(e) {
      dispatch(updateDescription(e.target.value));
    },
    onSpatialDomainChange: function onSpatialDomainChange(e) {
      if (e == null) dispatch(updateSpatialDomain(null));else dispatch(updateSpatialDomain(e.value));
    },
    onUpdateTree: function onUpdateTree(tree) {
      dispatch(updateTree(tree));
    },
    onAddInputVariable: function onAddInputVariable(variable) {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: function onRemoveInputVariable(i) {
      dispatch(removeInputVariable(i));
    },
    onEditInputVariable: function onEditInputVariable(variable, node, i) {
      dispatch(editInputVariable(variable, node, i));
    },
    onUpdateInputVariable: function onUpdateInputVariable(variable, i) {
      dispatch(updateInputVariable(variable, i));
    },
    onChangeOperandSelection: function onChangeOperandSelection(id, value) {
      dispatch(changeOperandSelection(id, value));
    },
    onEditNothing: function onEditNothing() {
      dispatch(editNothing());
    },
    onAddDataSource: function onAddDataSource() {
      dispatch(addDataSource());
    },
    onAddExpression: function onAddExpression() {
      dispatch(addExpression());
    },
    onUpdateRasterData: function onUpdateRasterData(data) {
      dispatch(updateRasterData(data));
    },
    onUpdateTabularData: function onUpdateTabularData(data) {
      dispatch(updateTabularData(data));
    },
    onUpdateExpressionData: function onUpdateExpressionData(data) {
      dispatch(updateExpressionData(data));
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
          "option",
          { value: "{\"type\":\"" + type + "\",\"name\":\"" + item.name + "\",\"id\":" + item.id + ",\"field\":\"" + field + "\"}" },
          item.name + "/" + field
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

    if (this.props.spatial_domain) {
      this.updateMap(this.props.spatial_domain);
    }
  };

  SpatialConfiguration.prototype.componentDidUpdate = function componentDidUpdate(prevProps) {
    if (prevProps.spatial_domain != this.props.spatial_domain) {
      if (this.geoJsonTileLayer) this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatial_domain) {
        this.updateMap(this.props.spatial_domain);
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
      { header: "Spatial configuration" },
      React.createElement(Select, { value: this.props.spatial_domain, options: layer_options,
        onChange: this.props.onSpatialDomainChange }),
      React.createElement("div", { id: "spatial-config-map", style: { height: 400, marginTop: 10 } })
    );
  };

  return SpatialConfiguration;
}(React.Component);

var VariableTable = function (_React$Component2) {
  _inherits(VariableTable, _React$Component2);

  function VariableTable() {
    var _temp, _this3, _ret;

    _classCallCheck(this, VariableTable);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this3 = _possibleConstructorReturn(this, _React$Component2.call.apply(_React$Component2, [this].concat(args))), _this3), _this3.useInputVariable = function (item, name) {
      if (!_this3.props.name) {
        _this3.props.onUpdateName(name);
      }
      _this3.props.onUpdateTree(item);
    }, _temp), _possibleConstructorReturn(_this3, _ret);
  }

  VariableTable.prototype.render = function render() {
    var _this4 = this;

    if (this.props.input_variables.length > 0) {
      var table = React.createElement(
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
          this.props.input_variables.map(function (node, i) {
            return React.createElement(
              "tr",
              null,
              React.createElement(
                "td",
                null,
                node.name
              ),
              React.createElement(
                "td",
                null,
                node.value.type
              ),
              React.createElement(
                "td",
                null,
                node.value.dimensions
              ),
              React.createElement(
                "td",
                null,
                React.createElement(
                  Button,
                  { onClick: function onClick() {
                      return _this4.useInputVariable(node.json(), node.name);
                    } },
                  "Use"
                ),
                React.createElement(
                  Button,
                  { onClick: function onClick() {
                      return _this4.props.onEditInputVariable(node, i);
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
                      _this4.props.onRemoveInputVariable(i);
                    }
                  },
                  "Delete"
                )
              )
            );
          })
        )
      );
    } else {
      table = React.createElement("p", null);
    }
    return React.createElement(
      Panel,
      { header: "Variables" },
      React.createElement(
        "div",
        { className: "pull-right" },
        React.createElement(
          Button,
          { disabled: this.props.input_variables.length == 0,
            onClick: function onClick() {
              return _this4.props.onAddExpression();
            } },
          "Add Expression"
        ),
        React.createElement(
          Button,
          { disabled: !this.props.spatial_domain,
            onClick: function onClick() {
              return _this4.props.onAddDataSource();
            } },
          "Add Data Source"
        )
      ),
      table
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

var AddDataSourcePanel = function (_React$Component3) {
  _inherits(AddDataSourcePanel, _React$Component3);

  function AddDataSourcePanel() {
    _classCallCheck(this, AddDataSourcePanel);

    return _possibleConstructorReturn(this, _React$Component3.apply(this, arguments));
  }

  AddDataSourcePanel.prototype.render = function render() {
    var _this6 = this;

    return React.createElement(
      Panel,
      { header: "Add a data source" },
      React.createElement(
        Row,
        null,
        React.createElement(
          Col,
          { md: 6 },
          React.createElement(
            Button,
            {
              onClick: function onClick() {
                return _this6.props.onUpdateTabularData(null);
              },
              style: { width: '100%', margin: '0.83em 0' } },
            React.createElement(Glyphicon, { glyph: "user" }),
            " I want to use a user-submitted table"
          )
        ),
        React.createElement(
          Col,
          { md: 6 },
          React.createElement(
            "h2",
            null,
            "Tabular Data"
          ),
          React.createElement(
            "p",
            null,
            "GeoKit users can provide specially formatted tabular data that GeoKit can use to render visualizations."
          ),
          React.createElement(
            "p",
            null,
            "Do you want to create a tabular data based visualization, but haven't uploaded your data yet?"
          ),
          React.createElement(
            "a",
            { href: "#", className: "button pull-right" },
            "Create some tabular data"
          )
        )
      ),
      React.createElement(
        Row,
        null,
        React.createElement(
          Col,
          { md: 6 },
          React.createElement(
            Button,
            {
              onClick: function onClick() {
                return _this6.props.onUpdateRasterData(null);
              },
              style: { width: '100%', margin: '0.83em 0' } },
            React.createElement(Glyphicon, { glyph: "cloud" }),
            " I want to use GeoKit data"
          )
        ),
        React.createElement(
          Col,
          { md: 6 },
          React.createElement(
            "h2",
            null,
            "Raster Data"
          ),
          React.createElement(
            "p",
            null,
            "GeoKit provides a service for reducing vast quantities of observational data to quantities that are practical for use in web applications for visualizing information about Earth."
          ),
          React.createElement(
            "p",
            null,
            "GeoKit raster data doesn't require any special setup beyond a small configuration step. Depending on the amount of data requested, the reduction procedure can take some time. Check the variables page to see information about the status of your variables."
          )
        )
      ),
      React.createElement(
        Button,
        { onClick: function onClick() {
            return _this6.props.onEditNothing();
          } },
        "Cancel"
      )
    );
  };

  return AddDataSourcePanel;
}(React.Component);

var SieveComponent = function (_React$Component4) {
  _inherits(SieveComponent, _React$Component4);

  function SieveComponent() {
    var _temp2, _this7, _ret2;

    _classCallCheck(this, SieveComponent);

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return _ret2 = (_temp2 = (_this7 = _possibleConstructorReturn(this, _React$Component4.call.apply(_React$Component4, [this].concat(args))), _this7), _this7.saveVariable = function () {
      var ivs = _this7.props.input_variables.map(function (v) {
        return DataNode.toTree(v);
      });
      _this7.props.onSaveVariable({
        id: _this7.props.id,
        name: _this7.props.name,
        tree: DataNode.toTree(_this7.props.tree),
        input_variables: ivs,
        description: _this7.props.description
      }, _this7.props.created);
    }, _temp2), _possibleConstructorReturn(_this7, _ret2);
  }

  SieveComponent.prototype.renderMiddlePanel = function renderMiddlePanel() {
    if (this.props.spatial_domain || this.props.input_variables.length && this.props.node_editor.mode == EDITING_EXPRESSION) {
      switch (this.props.node_editor.mode) {
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
    var _this8 = this;

    var final_render = null;
    var valid = !this.props.errors.name && !this.props.errors.tree;

    this.props.name;
    if (this.props.tree && this.props.tree.length) {
      var final = treeToNode(this.props.tree);
      final_render = React.createElement(
        "div",
        null,
        React.createElement(
          "form",
          null,
          React.createElement(
            FormGroup,
            { controlId: "range",
              validationState: this.props.errors.name ? "error" : null
            },
            React.createElement(FormControl, {
              name: "name", type: "text",
              placeholder: "Use alphanumeric name without spaces.",
              value: this.props.name ? this.props.name : null,
              onChange: function onChange(e) {
                _this8.props.onUpdateName(e.target.value, 'name');
              }
            }),
            React.createElement(
              HelpBlock,
              null,
              this.props.errors.name ? this.props.errors.name : ""
            )
          )
        ),
        React.createElement(
          "p",
          null,
          final.render()
        ),
        React.createElement(
          "div",
          { className: "btn-group" },
          this.props.changed && valid ? React.createElement(
            "button",
            {
              className: "button",
              onClick: this.saveVariable
            },
            "Save Changes"
          ) : null,
          this.props.id ? React.createElement(
            "a",
            {
              href: "/admin/variables/delete/" + this.props.id,
              className: "button serious pull-right"
            },
            "Delete"
          ) : null
        ),
        React.createElement(
          "p",
          null,
          React.createElement(
            "dl",
            null,
            React.createElement(
              "dt",
              null,
              "Created"
            ),
            " ",
            React.createElement(
              "dd",
              null,
              this.props.created
            ),
            React.createElement(
              "dt",
              null,
              "Last modified"
            ),
            " ",
            React.createElement(
              "dd",
              null,
              this.props.modified
            ),
            React.createElement(
              "dt",
              null,
              "Rasters used"
            ),
            " ",
            React.createElement(
              "dd",
              null,
              final.products.map(function (r) {
                return [r.render(), React.createElement("br", null)];
              })
            )
          )
        )
      );
    } else {
      final_render = React.createElement(
        "p",
        null,
        "Use controls to build and use the variable"
      );
    }
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
          { xs: 11 },
          this.renderMiddlePanel()
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
        Row,
        { className: "show-grid" },
        React.createElement(
          Col,
          { xs: 11 },
          React.createElement(
            Panel,
            { header: React.createElement(
                "h3",
                null,
                "Final ",
                final ? final.dimensions : '',
                " variable"
              ) },
            final_render
          )
        )
      )
    );
  };

  return SieveComponent;
}(React.Component);

var Sieve = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(SieveComponent);

function sieve(el) {
  var store = Redux.createStore(sieveApp, Redux.applyMiddleware(ReduxThunk.default));

  store.dispatch(fetchLayers());
  store.dispatch(fetchTables());
  store.dispatch(fetchVariables());
  store.dispatch(receiveRasterCatalog(window.raster_catalog));
  store.dispatch(receiveInputVariables(window.sieve_props.input_variables));

  ReactDOM.render(React.createElement(ReactRedux.Provider, {
    children: React.createElement(Sieve, sieve_props),
    store: store
  }), el);
}
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DataNode = function () {
  function DataNode(tree) {
    _classCallCheck(this, DataNode);

    this._operand_names = [];

    /// Consstructor is useless because it can't access subclass properties
    this._tree = tree;
  }

  DataNode.prototype.parseTree = function parseTree() {
    var tree = this._tree;

    if (!Array.isArray(tree)) {
      throw Error("DataNode can only be initialized from Array.");
    } else if (tree.length != 2) {
      throw Error("DataNode needs 2 elements, operator and operand in Array.");
    }
    this._operation = tree[0];
    this._operands = [];

    for (var i = 0; i < this.operand_names.length; i++) {
      // Let rand be undefined, as long as we have right length _operands
      var rand = tree[1][i];
      var rand_object = null;
      if (DataNode.isTree(rand)) {
        rand_object = treeToNode(rand);
      } else if (this._operation != 'source' && this.isSource(rand) && !DataNode.isNode(rand)) {
        rand_object = treeToNode(['source', [rand]]);
      } else {
        rand_object = rand;
      }
      this._operands.push(rand_object);
      this[this.operand_names[i]] = rand_object;
    }
  };

  DataNode.prototype.operand_types = function operand_types(join) {
    var types = [];
    for (var _iterator = self._operands, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var r = _ref;

      types.push(r.type);
    }
    if (join) {
      return types.join(join);
    } else {
      return types;
    }
  };

  DataNode.prototype.operands = function operands() {
    return this._operands;
  };

  DataNode.prototype.validOperands = function validOperands(input_vars, operand_refs, op_index) {
    return input_vars;
  };

  DataNode.prototype.json = function json() {
    var rands = [];
    for (var i = 0; i < this._operands.length; i++) {
      var rand = this._operands[i];
      if (DataNode.isNode(rand)) {
        rands.push(rand.json());
      } else {
        rands.push(rand);
      }
    }
    return [this._operation, rands];
  };

  DataNode.prototype.jsonText = function jsonText() {
    JSON.encode(this.json());
  };

  DataNode.prototype.render = function render() {
    var name = this._name ? this._name : "Unnamed";
    var rands = null;
    if (this._operands.length) {
      rands = this._operands.map(function (o, i) {
        if (DataNode.isNode(o)) {
          return o.render();
        } else {
          return o + ", ";
        }
      });
    }
    return React.createElement(
      "span",
      null,
      name,
      " ",
      rands ? React.createElement(
        "span",
        null,
        " of ",
        rands,
        " "
      ) : ''
    );
  };

  DataNode.isTree = function isTree(arg) {
    return Array.isArray(arg) && arg.length == 2 && DataNode.TYPES.hasOwnProperty(arg[0]);
  };

  DataNode.isNode = function isNode(node) {
    return node._operation && DataNode.TYPES.hasOwnProperty(node._operation) && node._operands != undefined;
  };

  DataNode.isSource = function isSource(obj) {
    return obj && obj.id && obj.type && (obj.type == 'Layer' || obj.type == 'Table');
  };

  DataNode.prototype.isSource = function isSource(obj) {
    return DataNode.isSource(obj);
  };

  DataNode.nameNode = function nameNode(name, node) {
    return new NamedTree(['named', [name, node]]);
  };

  DataNode.Class = function Class(name) {
    return DataNode.TYPES[name];
  };

  DataNode.toNode = function toNode(arg) {
    if (!DataNode.isNode(arg) && DataNode.isTree(arg)) {
      return treeToNode(arg);
    } else {
      return arg;
    }
  };

  DataNode.toTree = function toTree(arg) {
    if (DataNode.isNode(arg) && !DataNode.isTree(arg)) {
      return arg.json();
    } else {
      return arg;
    }
  };

  DataNode.prototype.isEquivalent = function isEquivalent(node) {
    if (this._operation && node._operation && this._operation == node._operation && this._operands && node._operands && this._operands.length == node._operands.length) {
      for (var i = 0; i < this._operands.length; i++) {
        var a = this._operands[i];
        var b = node._operands[i];
        if (DataNode.isNode(a) && DataNode.isNode(b)) {
          if (!a.isEquivalent(b)) {
            return false;
          }
        } else {
          if ((typeof a === "undefined" ? "undefined" : _typeof(a)) != (typeof b === "undefined" ? "undefined" : _typeof(b))) {
            return false;
          } else {
            if ((typeof a === "undefined" ? "undefined" : _typeof(a)) == Object) {
              if (!Object.keys(a).reduce(function (acc, k) {
                return a[k] == b[k] && acc;
              })) {
                return false;
              }
            } else if ((typeof a === "undefined" ? "undefined" : _typeof(a)) == Array) {
              if (!Array.keys(a).reduce(function (acc, i) {
                return a[i] == b[i] && acc;
              })) {
                return false;
              }
            } else {
              if (a != b) {
                return false;
              }
            }
          }
        }
      }
      return true;
    } else {
      return false;
    }
  };

  _createClass(DataNode, [{
    key: "type",
    get: function get() {
      return this._operation;
    },
    set: function set(type) {
      throw Error('Can not set type, has to be constructed');
    }
  }, {
    key: "arity",
    get: function get() {
      return DataNode.TYPES[this._operation].arity;
    }
  }, {
    key: "operand_names",
    get: function get() {
      return this._operand_names;
    }
  }, {
    key: "name",
    get: function get() {
      return this._name ? this._name : this._operation;
    },
    set: function set(value) {
      this._name = value;
    }
  }, {
    key: "dimensions",
    get: function get() {
      return this._dimensions;
    },
    set: function set(value) {
      this._dimensions = value;
    }
  }, {
    key: "layers",
    get: function get() {
      var layers = [];
      var self = this;
      if (self.type == "source") {
        if (self.operand.type == "Layer") {
          layers = [this];
        }
      } else {
        self._operands.forEach(function (operand) {
          var rand_layers = operand.layers;
          if (rand_layers && rand_layers.length > 0) {
            layers = layers.concat(rand_layers);
          }
        });
      }

      return layers;
    }
  }, {
    key: "products",
    get: function get() {
      var products = [];

      if (this.type == "raster") {
        products = [this];
      } else {
        this._operands.forEach(function (operand) {
          var rand_products = operand.products;
          if (rand_products && rand_products.length > 0) {
            products = products.concat(rand_products);
          }
        });
      }

      return products;
    }
  }]);

  return DataNode;
}();

DataNode.arity = 0;

var MeanOperator = function (_DataNode) {
  _inherits(MeanOperator, _DataNode);

  function MeanOperator(tree) {
    _classCallCheck(this, MeanOperator);

    var _this = _possibleConstructorReturn(this, _DataNode.call(this, tree));

    _this._name = 'Mean';
    _this._operand_names = ['left', 'right'];

    _this.parseTree();

    // congratulations! (undefined == undefined) == true
    if (_this.left.dimensions != _this.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    _this._dimensions = _this.left ? _this.left.dimensions : null;
    return _this;
  }

  MeanOperator.validOperands = function validOperands(input_vars, operand_refs, op_index) {
    var other_op_index = op_index == 0 ? 1 : 0;
    var other_op = input_vars.filter(function (input_var) {
      return input_var.name == operand_refs[other_op_index];
    })[0];

    if (!other_op) {
      return input_vars;
    } else {
      return input_vars.filter(function (input_var) {
        return input_var.dimensions == other_op.dimensions || input_var.dimensions == 'scalar';
      });
    }
  };

  return MeanOperator;
}(DataNode);

MeanOperator.arity = 2;

var TemporalMeanOperator = function (_DataNode2) {
  _inherits(TemporalMeanOperator, _DataNode2);

  function TemporalMeanOperator(tree) {
    _classCallCheck(this, TemporalMeanOperator);

    var _this2 = _possibleConstructorReturn(this, _DataNode2.call(this, tree));

    _this2._name = 'Temporal Mean';
    _this2._dimensions = 'space';
    _this2._operand_names = ['operand'];

    _this2.parseTree();
    return _this2;
  }

  TemporalMeanOperator.validOperands = function validOperands(input_vars) {
    return input_vars.filter(function (input_var) {
      return input_var.dimensions.includes('time');
    });
  };

  return TemporalMeanOperator;
}(DataNode);

TemporalMeanOperator.arity = 1;

var SpatialMeanOperator = function (_DataNode3) {
  _inherits(SpatialMeanOperator, _DataNode3);

  function SpatialMeanOperator(tree) {
    _classCallCheck(this, SpatialMeanOperator);

    var _this3 = _possibleConstructorReturn(this, _DataNode3.call(this, tree));

    _this3._operand_names = ['operand'];
    _this3._name = 'Spatial Mean';
    _this3._dimensions = 'time';

    _this3.parseTree();
    return _this3;
  }

  SpatialMeanOperator.validOperands = function validOperands(input_vars) {
    return input_vars.filter(function (input_var) {
      return input_var.dimensions.includes('space');
    });
  };

  return SpatialMeanOperator;
}(DataNode);

SpatialMeanOperator.arity = 1;

var SelectOperator = function (_DataNode4) {
  _inherits(SelectOperator, _DataNode4);

  function SelectOperator(tree) {
    _classCallCheck(this, SelectOperator);

    var _this4 = _possibleConstructorReturn(this, _DataNode4.call(this, tree));

    _this4._operand_names = ['left', 'right'];
    _this4._name = 'Select';

    _this4.parseTree();
    _this4._dimensions = _this4.left.dimensions;
    return _this4;
  }

  return SelectOperator;
}(DataNode);

SelectOperator.arity = 2;

var ExpressionOperator = function (_DataNode5) {
  _inherits(ExpressionOperator, _DataNode5);

  function ExpressionOperator(tree) {
    _classCallCheck(this, ExpressionOperator);

    var _this5 = _possibleConstructorReturn(this, _DataNode5.call(this, tree));

    _this5._name = 'Expression';
    _this5._operand_names = ['operand'];

    _this5.parseTree();
    _this5._dimensions = _this5.operand.dimensions;
    return _this5;
  }

  return ExpressionOperator;
}(DataNode);

ExpressionOperator.arity = 1;

var JoinOperator = function (_DataNode6) {
  _inherits(JoinOperator, _DataNode6);

  function JoinOperator(tree) {
    _classCallCheck(this, JoinOperator);

    var _this6 = _possibleConstructorReturn(this, _DataNode6.call(this, tree));

    _this6._name = 'Join';
    _this6._operand_names = ['left', 'right'];

    _this6.parseTree();

    var dimensions = new Set();
    dimensions.add(_this6.left.dimensions);
    dimensions.add(_this6.right.dimensions);

    _this6._dimensions = '';
    if (dimensions.has('space')) {
      _this6._dimensions += 'space';
    }
    if (dimensions.has('time')) {
      _this6._dimensions += 'time';
    }
    return _this6;
  }

  return JoinOperator;
}(DataNode);

JoinOperator.arity = 2;

var SourceOperator = function (_DataNode7) {
  _inherits(SourceOperator, _DataNode7);

  function SourceOperator(tree) {
    _classCallCheck(this, SourceOperator);

    var _this7 = _possibleConstructorReturn(this, _DataNode7.call(this, tree));

    _this7._operand_names = ['operand'];
    _this7._name = 'Source';

    _this7.parseTree();

    if (!(_this7.isSource(_this7.operand) && _this7.operand.field)) {
      throw Error("Source node is missing some property (id, type, or field");
    }

    if (_this7.operand.type == 'Layer') {
      _this7._dimensions = 'space';
    } else if (_this7.operand.type == 'Table') {
      _this7._dimensions = 'time';
    } else {
      throw Error("Source type unknown");
    }
    _this7['id'] = _this7.operand.id;
    return _this7;
  }

  SourceOperator.prototype.render = function render() {
    var o = this.operand;
    return React.createElement(
      "span",
      null,
      o.type + "/" + o.name + (o.field ? "/" + o.field : ""),
      "\xA0"
    );
  };

  return SourceOperator;
}(DataNode);

SourceOperator.arity = 1;

var RasterOperator = function (_DataNode8) {
  _inherits(RasterOperator, _DataNode8);

  function RasterOperator(tree) {
    _classCallCheck(this, RasterOperator);

    var _this8 = _possibleConstructorReturn(this, _DataNode8.call(this, tree));

    _this8._operand_names = ['product', 'layer', 'range'];
    _this8._name = 'Raster';
    _this8._dimensions = 'spacetime';

    _this8.parseTree();
    var range_arr = _this8.range.split(',');
    _this8.start = range_arr[0];
    _this8.start_date = RasterOperator.julianToDate(_this8.start);
    _this8.end = range_arr[1];
    _this8.end_date = RasterOperator.julianToDate(_this8.end);
    return _this8;
  }

  RasterOperator.julianToDate = function julianToDate(str) {
    var doy = parseInt(str.split('-')[1]);
    var year = parseInt(str.split('-')[0]);
    var date = new Date(year, 0);
    date.setDate(doy);
    return date;
  };

  RasterOperator.prototype.render = function render() {
    var layer = "no layer";
    if (this.layer.render) {
      layer = this.layer.render();
    } else {
      console.log(this.layer, this.layer.json);
    }
    return React.createElement(
      "span",
      null,
      "Raster product ",
      this.product.name,
      "\xA0 using ",
      layer,
      "\xA0 in the time span of ",
      this.start,
      " - ",
      this.end
    );
  };

  return RasterOperator;
}(DataNode);

RasterOperator.arity = 3;

var MathOperator = function (_DataNode9) {
  _inherits(MathOperator, _DataNode9);

  function MathOperator(tree) {
    _classCallCheck(this, MathOperator);

    var _this9 = _possibleConstructorReturn(this, _DataNode9.call(this, tree));

    _this9._operand_names = ['left', 'right'];

    _this9.parseTree();

    _this9._name = _this9._operator;

    if (_this9.left && _this9.right && _this9.left.dimensions != _this9.right.dimensions) {
      // Great how this passes when both are undefined
      throw Error("Operators must have the same dimensions");
    }

    _this9._dimensions = _this9.left ? _this9.left.dimensions : null;
    return _this9;
  }

  MathOperator.validOperands = function validOperands(input_vars, operand_refs, op_index) {
    var other_op_index = op_index == 0 ? 1 : 0;
    var other_op = operand_refs[other_op_index] ? input_vars.filter(function (input_var) {
      return input_var.name == operand_refs[other_op_index];
    })[0] : false;

    if (!other_op) {
      return input_vars;
    } else {
      return input_vars.filter(function (input_var) {
        return input_var.dimensions == other_op.dimensions || input_var.dimensions == 'scalar';
      });
    }
  };

  return MathOperator;
}(DataNode);

MathOperator.arity = 2;

var NumericOperator = function (_DataNode10) {
  _inherits(NumericOperator, _DataNode10);

  // Technically should be scalar, but this is correct enough for now.

  function NumericOperator(tree) {
    _classCallCheck(this, NumericOperator);

    var _this10 = _possibleConstructorReturn(this, _DataNode10.call(this, tree));

    _this10._operand_names = ['operand'];
    _this10._name = 'Numeric';
    _this10._dimensions = 'spacetime';


    _this10.parseTree();
    return _this10;
  }

  NumericOperator.validOperands = function validOperands(input_vars, operand_ref, op_index) {
    console.log(input_vars);
    return input_vars;
  };

  NumericOperator.prototype.render = function render() {
    return React.createElement(
      "span",
      null,
      this.operand
    );
  };

  return NumericOperator;
}(DataNode);

NumericOperator.arity = 1;

var NamedTree = function (_DataNode11) {
  _inherits(NamedTree, _DataNode11);

  function NamedTree(args) {
    _classCallCheck(this, NamedTree);

    var _this11 = _possibleConstructorReturn(this, _DataNode11.call(this, args));

    _this11._operand_names = ['name_operand', 'value'];

    _this11.parseTree();
    _this11.dimensions = _this11.value.dimensions;
    _this11._name = _this11.name_operand;
    return _this11;
  }

  NamedTree.prototype.json = function json() {
    return ['named', [this._name, this.value.json ? this.value.json() : this.value]];
  };

  NamedTree.prototype.render = function render() {
    return React.createElement(
      "span",
      null,
      React.createElement(
        "strong",
        null,
        this.name
      ),
      ": ",
      this.value.render()
    );
  };

  return NamedTree;
}(DataNode);

NamedTree.arity = 2;

var EmptyTree = function (_DataNode12) {
  _inherits(EmptyTree, _DataNode12);

  function EmptyTree(props) {
    _classCallCheck(this, EmptyTree);

    var _this12 = _possibleConstructorReturn(this, _DataNode12.call(this, ['noop', []]));

    _this12._name = 'Empty';

    _this12.parseTree();
    return _this12;
  }

  EmptyTree.prototype.render = function render() {
    return React.createElement(
      "span",
      null,
      "Empty"
    );
  };

  return EmptyTree;
}(DataNode);

var ErrorTree = function (_DataNode13) {
  _inherits(ErrorTree, _DataNode13);

  function ErrorTree(args, error) {
    _classCallCheck(this, ErrorTree);

    var _this13 = _possibleConstructorReturn(this, _DataNode13.call(this, ['error', [args, error]]));

    _this13._operand_names = ['data', 'error'];

    _this13.parseTree();
    return _this13;
  }

  return ErrorTree;
}(DataNode);

ErrorTree.arity = 2;


DataNode.TYPES = {
  'mean': MeanOperator,
  'tmean': TemporalMeanOperator,
  'smean': SpatialMeanOperator,
  'select': SelectOperator,
  'expression': ExpressionOperator,
  'join': JoinOperator,
  'raster': RasterOperator,
  'source': SourceOperator,
  '+': MathOperator,
  '-': MathOperator,
  '*': MathOperator,
  '/': MathOperator,
  'numeric': NumericOperator,
  'named': NamedTree,
  'noop': EmptyTree,
  'error': ErrorTree
};

function treeToNode(tree) {
  if (!tree || Object.keys(tree).length == 0) {
    return new EmptyTree();
  } else if (DataNode.isNode(tree)) {
    return tree;
  } else {
    if (!DataNode.TYPES.hasOwnProperty(tree[0])) {
      throw Error("'" + tree[0] + "' is not a valid operator");
    } else {
      var Operator = DataNode.TYPES[tree[0]];
      return new Operator(tree);
    }
  }
}

function opArity(operation) {
  return DataNode.TYPES[operation].arity;
}

//# sourceMappingURL=sieve.js.map
'use strict';

var REQUEST_LAYERS = 'REQUEST_LAYERS';
var RECEIVE_LAYERS = 'RECEIVE_LAYERS';

var REQUEST_TABLES = 'REQUEST_TABLES';
var RECEIVE_TABLES = 'RECEIVE_TABLES';

var RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
var REQUEST_VARIABLES = 'REQUEST_VARIABLES';

var UPDATE_METADATA = 'UPDATE_METADATA';
var UPDATE_TREE = 'UPDATE_TREE';

var REMOVE_VARIABLE = 'REMOVE_VARIABLE';
var ADD_VARIABLE = 'ADD_VARIABLE';

var ADD_TREE_NODE = 'ADD_TREE_NODE';

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
        console.error(this.props.url, status, err.toString());
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
        console.error(this.props.url, status, err.toString());
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
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

var nextVariableId = 0;

function addInputVariable(variable) {
  return {
    type: ADD_VARIABLE,
    id: nextVariableId++,
    variable: variable
  };
}

function addTreeNode(node) {
  return {
    type: ADD_TREE_NODE,
    node: node
  };
}

function updateMetadata(metadata) {
  return {
    type: UPDATE_METADATA,
    name: metadata.title,
    description: metadata.description
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
          onChange: this.onTitleChange.bind(this) })
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

function input_variable(state, action) {
  switch (action.type) {
    case 'ADD_VARIABLE':
      return {
        id: action.id,
        variable: action.variable
      };
    default:
      return state;
  }
}

function input_variables() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case ADD_VARIABLE:
      return [].concat(state, [action.variable
      //input_variable(undefined, action)
      ]);
    default:
      return state;
  }
}

function tree() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var action = arguments[1];

  switch (action.type) {
    case ADD_TREE_NODE:
      return action.node;
    default:
      return state;
  }
}
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ReactBootstrap = ReactBootstrap;
var Table = _ReactBootstrap.Table;
var Panel = _ReactBootstrap.Panel;
var ButtonGroup = _ReactBootstrap.ButtonGroup;
var ButtonToolbar = _ReactBootstrap.ButtonToolbar;
var ButtonInput = _ReactBootstrap.ButtonInput;
var Button = _ReactBootstrap.Button;
var Row = _ReactBootstrap.Row;
var Col = _ReactBootstrap.Col;
var Alert = _ReactBootstrap.Alert;
var Input = _ReactBootstrap.Input;
var OverlayTrigger = _ReactBootstrap.OverlayTrigger;
var Tooltip = _ReactBootstrap.Tooltip;
var Tabs = _ReactBootstrap.Tabs;
var Tab = _ReactBootstrap.Tab;
var DropdownButton = _ReactBootstrap.DropdownButton;
var MenuItem = _ReactBootstrap.MenuItem;
var Modal = _ReactBootstrap.Modal;
var FieldGroup = _ReactBootstrap.FieldGroup;
var FormControl = _ReactBootstrap.FormControl;
var ControlLabel = _ReactBootstrap.ControlLabel;
var FormGroup = _ReactBootstrap.FormGroup;

/* app */

var initialState = Object.assign({
  name: "",
  description: "",
  spatialDomain: null,
  temporalDomain: { start: null, end: null },
  errors: {},
  tree: {},
  input_variables: []
}, sieve_props.initialData);

function sieveApp() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
  var action = arguments[1];

  switch (action.type) {
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
    case REQUEST_VARIABLES:
    case RECEIVE_VARIABLES:
      return Object.assign({}, state, {
        variables: variables(state[action.variables], action)
      });
    case UPDATE_METADATA:
      return Object.assign({}, state, {
        name: action.name,
        description: action.description
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        tree: action.tree
      });
    case ADD_TREE_NODE:
      return Object.assign({}, state, {
        tree: tree(state.tree, action)
      });
    case ADD_VARIABLE:
      return Object.assign({}, state, {
        input_variables: input_variables(state.input_variables, action)
      });
    default:
      return state;
  }
}

var mapStateToProps = function mapStateToProps(state) {
  return Object.assign({}, state, {
    metadata: { title: state.name, description: state.description }
  });
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    onMetadataChange: function onMetadataChange(metadata) {
      dispatch(updateMetadata(metadata));
    },
    onAddInputVariable: function onAddInputVariable(variable) {
      dispatch(addInputVariable(variable));
    },
    onAddTreeOp: function onAddTreeOp(op) {
      dispatch(addTreeNode(op));
    }
  };
};

/* components */
var DropdownComponent = function DropdownComponent(_ref) {
  var things = _ref.things;
  var onclick = _ref.onclick;
  return(
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

var i2o = function i2o(type, item, i) {
  return function (item, i) {
    if (item.field_names) {
      return item.field_names.map(function (field, j) {
        return React.createElement(
          "option",
          { value: "{\"type\": \"" + type + "\", \"id\": \"" + item.name + "\", \"field\": \"" + field + "\"}" },
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

var AddExpressionInputModal = function (_React$Component3) {
  _inherits(AddExpressionInputModal, _React$Component3);

  function AddExpressionInputModal(props) {
    _classCallCheck(this, AddExpressionInputModal);

    var _this5 = _possibleConstructorReturn(this, _React$Component3.call(this, props));

    _this5.state = { showModal: false };
    return _this5;
  }

  AddExpressionInputModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddExpressionInputModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddExpressionInputModal.prototype.use = function use() {
    var form = $(this.form).serializeArray();
    var variable = ['expression', [JSON.parse(form[0]['value'])]];
    this.props.onAddInputVariable(variable);
    this.setState({ showModal: false });
  };

  AddExpressionInputModal.prototype.render = function render() {
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
            "Adding Input Variable"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "form",
            { ref: function ref(_ref3) {
                _this6.form = _ref3;
              } },
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

var AddBinOpModal = function (_React$Component4) {
  _inherits(AddBinOpModal, _React$Component4);

  function AddBinOpModal(props) {
    _classCallCheck(this, AddBinOpModal);

    var _this7 = _possibleConstructorReturn(this, _React$Component4.call(this, props));

    _this7.state = { showModal: false };
    return _this7;
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
    var _this8 = this;

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
            { ref: function ref(_ref4) {
                _this8.form = _ref4;
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
                  "tree"
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
                  "tree"
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

var AddSelectModal = function (_React$Component5) {
  _inherits(AddSelectModal, _React$Component5);

  function AddSelectModal(props) {
    _classCallCheck(this, AddSelectModal);

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

var AddMeanModal = function (_React$Component6) {
  _inherits(AddMeanModal, _React$Component6);

  function AddMeanModal(props) {
    _classCallCheck(this, AddMeanModal);

    var _this10 = _possibleConstructorReturn(this, _React$Component6.call(this, props));

    _this10.onSelectNode = function (select_node) {
      _this10.setState({ select_node: select_node });
    };

    _this10.state = {
      showModal: false,
      select_node: null
    };
    return _this10;
  }

  AddMeanModal.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  AddMeanModal.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  AddMeanModal.prototype.use = function use() {
    if (this.state.select_node) {
      this.props.onAddTreeOp(this.state.select_node);
      this.setState({ showModal: false });
    } else {
      alert('Select a variable to use.');
    }
  };

  AddMeanModal.prototype.render = function render() {
    var _this11 = this;

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
          React.createElement(SelectForm, _extends({ onSelectNode: this.onSelectNode }, this.props)),
          React.createElement(
            "form",
            { ref: function ref(_ref5) {
                _this11.form = _ref5;
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

  return AddMeanModal;
}(React.Component);

var SelectForm = function (_React$Component7) {
  _inherits(SelectForm, _React$Component7);

  function SelectForm(props) {
    _classCallCheck(this, SelectForm);

    var _this12 = _possibleConstructorReturn(this, _React$Component7.call(this, props));

    _this12.onVariableChange = function (e) {
      if (e.target.value) {
        _this12.setState({ select_variable: JSON.parse(e.target.value) });
      }
    };

    _this12.onPropertyChange = function (e) {
      //this.setState({select_property: JSON.parse(e.target.value)});
      if (e.target.value) {
        var node = ['select', [_this12.state.select_variable, JSON.parse(e.target.value)]];
        _this12.props.onSelectNode(node);
      }
    };

    _this12.state = { variable: null, select_variable: null, select_property: null };
    return _this12;
  }

  SelectForm.prototype.render = function render() {
    var _this13 = this;

    var property = null;
    if (this.state.select_variable) {
      property = React.createElement(
        FormGroup,
        { controlId: "rightSelect" },
        React.createElement(
          ControlLabel,
          null,
          "Variable Property"
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
          this.props.layers.items.map(i2o('Layer')).concat(this.props.tables.items.map(i2o('Table')))
        )
      );
    }
    return React.createElement(
      "form",
      { ref: function ref(_ref6) {
          _this13.form = _ref6;
        } },
      React.createElement(
        FormGroup,
        { controlId: "leftSelect" },
        React.createElement(
          ControlLabel,
          null,
          "Input Variable"
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
              v.name ? v.name : rendertree(v)
            );
          })
        )
      ),
      property
    );
  };

  return SelectForm;
}(React.Component);

var SieveComponent = function (_React$Component8) {
  _inherits(SieveComponent, _React$Component8);

  function SieveComponent(props) {
    _classCallCheck(this, SieveComponent);

    return _possibleConstructorReturn(this, _React$Component8.call(this, props));
  }

  SieveComponent.prototype.validateVariable = function validateVariable() {
    var errors = {},
        isValid = true,
        data = {
      name: this.props.metadata.title,
      description: this.props.metadata.description,
      tree: this.props.tree
    };

    if (!data.name || data.name === '') {
      isValid = false;
      errors.name = "You must provide a title.";
    }

    if (!data.tree || data.tree === '') {
      isValid = false;
      errors.tree = "You must specify variable text.";
    }

    return { isValid: isValid, errors: errors, data: data };
  };

  SieveComponent.prototype.saveVariable = function saveVariable(e) {
    var _this15 = this;

    e.stopPropagation();
    var validationResponse = this.validateVariable();

    if (validationResponse.isValid) {
      var xhr = new XMLHttpRequest();

      if (this.props.initialData) {
        xhr.open("PUT", "/api/variables/" + this.props.initialData.id + "/", true);
      } else {
        xhr.open("POST", "/api/variables/", true);
      }

      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));

      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          if (200 <= xhr.status && xhr.status < 300) {
            window.location.href = window.redirect_after_save;
          } else {
            _this15.setState({ errors: { server: xhr.response } });
          }
        }
      };

      xhr.send(JSON.stringify(validationResponse.data));
    } else {
      console.log(validationResponse.errors);
      this.setState({ errors: validationResponse.errors });
    }
  };

  SieveComponent.prototype.render = function render() {
    var self = this;

    return React.createElement(
      "div",
      { className: "sieve" },
      this.state.errors.server ? React.createElement(
        Alert,
        { bsStyle: "danger" },
        this.state.errors.server
      ) : null,
      React.createElement(
        Panel,
        null,
        React.createElement(MetaData, {
          ref: "metadata",
          updateMetadata: this.props.onMetadataChange.bind(this),
          title: this.props.metadata.title, description: this.props.metadata.description })
      ),
      React.createElement(
        Panel,
        { header: React.createElement(
            "h3",
            null,
            "Input Variables"
          ) },
        this.props.input_variables.length ? React.createElement(
          "dl",
          { className: "dl-horizontal" },
          this.props.input_variables.map(function (variable) {
            return [React.createElement(
              "dt",
              null,
              variable.name
            ), React.createElement(
              "dd",
              null,
              rendertree(variable.node)
            )];
          })
        ) : "Add some!",
        React.createElement(
          "div",
          { className: "pull-right" },
          React.createElement(
            ButtonToolbar,
            null,
            React.createElement(
              ButtonGroup,
              null,
              React.createElement(
                AddDataInputModal,
                this.props,
                "Add Data Input"
              ),
              React.createElement(
                AddExpressionInputModal,
                this.props,
                "Add Expression Input"
              )
            )
          )
        )
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(
          "div",
          { className: "pull-right" },
          React.createElement(
            ButtonToolbar,
            null,
            React.createElement(
              ButtonGroup,
              null,
              React.createElement(
                AddSelectModal,
                _extends({ op: "select" }, this.props),
                "Select"
              ),
              React.createElement(
                AddMeanModal,
                _extends({ op: "mean" }, this.props),
                "Mean"
              ),
              React.createElement(
                AddBinOpModal,
                _extends({ op: "*" }, this.props),
                "x"
              ),
              React.createElement(
                AddBinOpModal,
                _extends({ op: "/" }, this.props),
                "/"
              ),
              React.createElement(
                AddBinOpModal,
                _extends({ op: "+" }, this.props),
                "+"
              ),
              React.createElement(
                AddBinOpModal,
                _extends({ op: "-" }, this.props),
                "-"
              )
            )
          )
        ),
        React.createElement(
          "p",
          null,
          rendertree(this.props.tree)
        )
      ),
      React.createElement(
        ButtonInput,
        { bsSize: "large", onClick: this.saveVariable.bind(this) },
        "Save"
      )
    );
  };

  return SieveComponent;
}(React.Component);

var rendertree = function rendertree(tree) {
  //console.log('render: ', tree);
  if (tree.length && tree.length == 2) {
    var op = tree[0];
    var left = tree[1][0];
    var right = tree[1][1];

    switch (op) {
      case 'select':
        return "Select " + right.id + "/" + right.field + " from (" + rendertree(left) + ")";
      case 'expression':
        return left;
      case 'join':
        var str = "Join " + left.type + ' ' + left.id + ' and ' + right.type + ' ' + right.id + ' on ' + left.field + ' = ' + right.field;
        return str;
      default:
        return rendertree(left) + " " + op + " " + rendertree(right);
    }
  } else {
    return JSON.stringify(tree);
  }
};

var TreeView = function (_React$Component9) {
  _inherits(TreeView, _React$Component9);

  function TreeView() {
    _classCallCheck(this, TreeView);

    return _possibleConstructorReturn(this, _React$Component9.apply(this, arguments));
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

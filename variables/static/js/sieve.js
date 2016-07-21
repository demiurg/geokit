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
"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

/* app */

var initialState = Object.assign({
  title: "",
  description: "",
  variableText: "",
  filters: [],
  spatialDomain: null,
  temporalDomain: { start: null, end: null },
  aggregateDimension: "NA",
  aggregateMethod: null,

  errors: {},
  position: 0
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
        title: action.metadata.title,
        description: action.metadata.description
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        variableText: action.text
      });
    default:
      return state;
  }
}

var mapStateToProps = function mapStateToProps(state) {
  return Object.assign({}, state, {
    metadata: { title: state.title, description: state.description },
    tree: state.variableText,
    variables: [state.layers, state.variables, state.tables],
    input_variables: [],
    layers: state.layers,
    tables: state.tables
  });
};

var mapDispatchToProps = function mapDispatchToProps(dispatch) {
  return {
    onMetadataChange: function onMetadataChange(metadata) {
      dispatch(updateMetadata(metadata));
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
    if (this.props.tables.items.length && this.props.layers.items.length) {
      join = React.createElement(
        JoinZard,
        this.props,
        "Join"
      );
    }
    return React.createElement(
      "div",
      { className: "pull-right" },
      join,
      React.createElement(
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
      )
    );
  };

  return VariableButtonGroup;
}(React.Component);

var JoinForm = function (_React$Component2) {
  _inherits(JoinForm, _React$Component2);

  function JoinForm() {
    _classCallCheck(this, JoinForm);

    return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
  }

  JoinForm.prototype.render = function render() {
    var _props = this.props;
    var _props$fields = _props.fields;
    var left = _props$fields.left;
    var right = _props$fields.right;
    var column = _props$fields.column;
    var resetForm = _props.resetForm;
    var handleSubmit = _props.handleSubmit;
    var submitting = _props.submitting;

    return React.createElement(
      "form",
      { onSubmit: handleSubmit },
      React.createElement(
        "div",
        null,
        React.createElement("input", _extends({ type: "text", placeholder: "Left variable" }, left))
      )
    );
  };

  return JoinForm;
}(React.Component);

var JoinZard = function (_React$Component3) {
  _inherits(JoinZard, _React$Component3);

  function JoinZard(props) {
    _classCallCheck(this, JoinZard);

    var _this4 = _possibleConstructorReturn(this, _React$Component3.call(this, props));

    _this4.state = { showModal: false };
    return _this4;
  }

  JoinZard.prototype.close = function close() {
    this.setState({ showModal: false });
  };

  JoinZard.prototype.open = function open() {
    this.setState({ showModal: true });
  };

  JoinZard.prototype.use = function use() {
    this.setState({ showModal: false });
  };

  JoinZard.prototype.render = function render() {
    return React.createElement(
      "div",
      { className: "pull-right" },
      React.createElement(
        Button,
        {
          bsStyle: "primary",
          onClick: this.open.bind(this)
        },
        "Join"
      ),
      React.createElement(
        Modal,
        { show: this.state.showModal, onHide: this.close.bind(this) },
        React.createElement(
          Modal.Header,
          { closeButton: true },
          React.createElement(
            Modal.Title,
            null,
            "Modal heading"
          )
        ),
        React.createElement(
          Modal.Body,
          null,
          React.createElement(
            "h4",
            null,
            "Text in a modal"
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

  return JoinZard;
}(React.Component);

var SieveComponent = function (_React$Component4) {
  _inherits(SieveComponent, _React$Component4);

  function SieveComponent(props) {
    _classCallCheck(this, SieveComponent);

    return _possibleConstructorReturn(this, _React$Component4.call(this, props));
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
    var _this6 = this;

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
            _this6.setState({ errors: { server: xhr.response } });
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
    var _this7 = this;

    var self = this;

    return React.createElement(
      "div",
      { className: "sieve" },
      this.props.errors.server ? React.createElement(
        Alert,
        { bsStyle: "danger" },
        this.props.errors.server
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
        null,
        React.createElement(
          Row,
          null,
          React.createElement(
            Col,
            { sm: 4 },
            React.createElement(
              "h3",
              null,
              "Configure Start Date"
            ),
            React.createElement(TemporalConfigurator, {
              date: this.props.temporalDomain.start,
              dateUpdated: this.updateStartDate.bind(this),
              ref: "dateStart" })
          ),
          React.createElement(
            Col,
            { sm: 4 },
            React.createElement(
              "h3",
              null,
              "Configure End Date"
            ),
            React.createElement(TemporalConfigurator, {
              date: this.props.temporalDomain.end,
              dateUpdated: this.updateEndDate.bind(this),
              ref: "dateEnd" })
          ),
          React.createElement(
            Col,
            { sm: 4 },
            React.createElement(
              "h3",
              null,
              "Interval Duration"
            ),
            React.createElement(IntervalConfigurator, this.props)
          )
        )
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(
          ButtonToolbar,
          null,
          React.createElement(
            ButtonGroup,
            null,
            React.createElement(
              Button,
              { onClick: function onClick() {
                  positionedInsert('*');
                } },
              "x"
            ),
            React.createElement(
              Button,
              { onClick: function onClick() {
                  positionedInsert('/');
                } },
              "/"
            ),
            React.createElement(
              Button,
              { onClick: function onClick() {
                  positionedInsert('+');
                } },
              "+"
            ),
            React.createElement(
              Button,
              { onClick: function onClick() {
                  positionedInsert('-');
                } },
              "-"
            )
          ),
          React.createElement(VariableButtonGroup, this.props)
        ),
        React.createElement(Input, { type: "textarea",
          style: { resize: "vertical" },
          ref: "variableEditor",
          value: this.props.variableText,
          onChange: function onChange(e) {
            return _this7.props.onVariableTextChange(e.target.value);
          }
        }),
        React.createElement(Filter, { filters: this.props.filters, updateFilters: this.updateFilters.bind(this) })
      ),
      React.createElement(
        Panel,
        null,
        React.createElement(Aggregate, {
          dimension: this.props.aggregateDimension,
          method: this.props.aggregateMethod,
          updateAggregateDimension: this.updateAggregateDimension.bind(this),
          updateAggregateMethod: this.updateAggregateMethod.bind(this) })
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

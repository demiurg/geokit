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
            onChange={this.onTitleChange.bind(this)}
            validationState={
              (this.props.errors && this.props.errors.title) ?
              this.props.errors.title : null 
            }
          />
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
              <option value="lte">Less than or equal to</option>
              <option value="et">Equal to</option>
              <option value="gt">Greater than</option>
              <option value="gte">Greater than or equal to</option>
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

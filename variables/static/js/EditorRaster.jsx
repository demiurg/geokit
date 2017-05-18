
var dateToDOY = (date) => {
  var year = date.getFullYear();
  var oneDay = 1000 * 60 * 60 * 24; // A day in milliseconds

  var doy = (Date.UTC(year, date.getMonth(), date.getDate()) -
            Date.UTC(year, 0, 0)) / 24 / 60 / 60 / 1000;

  var doyStr = doy.toString();
  while (doyStr.length < 3){ //pad with zeros
    doyStr = "0" + doyStr;
  }

  return year.toString() + "-" + doyStr;
}

class RasterProductTable extends React.Component {
  generateName(id, var_list=null) {
    var name = id.replace(/_/g, "-");
    var i = 1;

    var input_variables = [];
    if (var_list){
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach((input) => {
      if ((name + '-' + i) == input.name ){
        i++;
      }
    });

    return name + '-' + i;
  }

  selectRaster(raster){
    var dname = this.generateName(raster.name, this.props.input_variables);
    var data = Object.assign(
      {},
      this.props.node_editor.raster_data,
      {
        default_name: dname,
        raster: raster,
        product: {id: raster.name, name: raster.description}
      }
    );
    this.props.onUpdateRasterData(data);
  }

  render() {
    var raster = this.props.node_editor.raster_data.raster ? raster : false;

    if (!this.props.raster_catalog){
      return <p>Raster catalog is temporarily unavailable.</p>;
    }

    return (
      <div className="row">
        <Table className="table-fixed" striped>
          <thead>
            <tr>
              <th className="col-xs-3">Description</th>
              <th className="col-xs-1">Driver</th>
              <th className="col-xs-2">Product</th>
              <th className="col-xs-2">Available From</th>
              <th className="col-xs-2">Available To</th>
              <th className="col-xs-2">Select</th>
            </tr>
          </thead>
          <tbody>
            {this.props.raster_catalog.items.map((r, i) => (
              <tr
                key={i}
                className={(raster && raster.id == r.id) ? 'active' : ''}
              >
                <td className="col-xs-3" style={{'clear': 'both'}}>{r.description}</td>
                <td className="col-xs-1">{r.driver}</td>
                <td className="col-xs-2">{r.product}</td>
                <td className="col-xs-2">{r.start_date}</td>
                <td className="col-xs-2">{r.end_date}</td>
                <td className="col-xs-2"><Button
                  onClick={(e) => this.selectRaster(r)}>
                    {(raster && raster.id == r.id)  ? 'Selected' : 'Select'}
                  </Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }
}

class RasterDataSource extends React.Component {
  onSave() {
    if (!this.props.node_editor.raster_data.valid){
      return; // Do not submit if there are errors
    }
    var data = this.props.node_editor.raster_data;

    var name = data.name;
    if (name == null || name.length == 0){
      name = data.default_name;
    }

    var layer = {type: 'Layer', id: this.props.spatial_domain, field: 'fid'};
    for (let input_layer of this.props.layers.items){
      if (input_layer.id == layer.id){
        layer['name'] = input_layer['name'];
        break;
      }
    }

    var variable = ['named', [
      name,
      [
        'raster',
        [
          data.product,
          ['source', [layer]],
          data.date_range
        ]
      ]
    ]];

    if (data.editing){
      this.props.onUpdateInputVariable(variable, data.index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateRasterData();
    this.props.onEditNothing();
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

  componentDidUpdate(prevProps, prevState){
    // If raster is set and if new raster is different than previous raster
    var self = this;
    var cal_format = {
      toDisplay: function (date, format, language){
        var userTimezoneOffset = date.getTimezoneOffset() * 60000;
        var d = new Date(date.getTime() + userTimezoneOffset);
        return dateToDOY(d);
      },
      toValue: function (date, format, language){
        var d = new Date(date);
        return d;
      }
    };
    if(
      self.props.node_editor.raster_data.raster &&
      (
        !prevProps.node_editor.raster_data.raster ||
        (
          prevProps.node_editor.raster_data.raster.name !=
          self.props.node_editor.raster_data.raster.name
        )
      )
    ){
      var r = self.props.node_editor.raster_data.raster;
      // console.log('update', r.start_date, r.end_date);

      $(self.startpicker).datepicker({
        'format': cal_format,
        'startDate': new Date(r.start_date),
        'endDate': new Date(r.end_date)
      }).on("changeDate", (e) => {
        self.onChange();
      });

      $(self.endpicker).datepicker({
        'format': cal_format,
        'startDate': new Date(r.start_date),
        'endDate': new Date(r.end_date)
      }).on("changeDate", (e) => {
        self.onChange();
      });
    }
  }

  onChange() {
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    var date_start = form[1]['value'];
    var date_end = form[2]['value'];
    var range = date_start + ',' + date_end;

    var data = this.props.node_editor.raster_data;
    var raster_start_date = new Date(data.raster.start_date);
    var raster_end_date = new Date(data.raster.end_date);

    var errors = {};

    if (!date_start){
      errors['date_start'] = "Start date is required. ";
    }else{
      if(!date_start.match(/\d{4}-\d{3}/g)){
        errors['date_start'] = "Start date must be entered in the form yyyy-ddd. ";
      }else{
        var doy_start = parseInt(date_start.split('-')[1]);
        var year_start = parseInt(date_start.split('-')[0]);
        var date_start_date = new Date(year_start, 0);
        date_start_date.setDate(doy_start);
        if (date_start_date < raster_start_date){
          errors['date_start'] = (
            "Start date must be after " + raster_start_date.toDateString() + ". "
          );
        }
      }
    }

    if (!date_end){
      errors['date_end'] = "End date is required. ";
    }else{
      if(!date_end.match(/\d{4}-\d{3}/g)){
        errors['date_start'] = "End date must be entered in the form yyyy-ddd. ";
      }else{
        var doy_end = parseInt(date_end.split('-')[1]);
        var year_end = parseInt(date_end.split('-')[0]);
        var date_end_date = new Date(year_end, 0);
        date_end_date.setDate(doy_end);

        if (date_end_date > raster_end_date){
          errors['date_end'] = (
            "End date must be before " + raster_end_date.toDateString() + ". "
          );
        }
      }
    }

    if((name && name.length > 0) && !name.match(/^[a-zA-Z0-9-]+$/)){
      errors['name'] = "Name must be alphanumeric, without spaces.";
    }

    var data = Object.assign(
      {},
      this.props.node_editor.raster_data,
      {
        name: name,
        date_start: date_start,
        date_end: date_end,
        date_range: range,
        errors: errors,
        valid: Object.keys(errors) == 0
      }
    );

    this.props.onUpdateRasterData(data);
  };

  render() {
    var data = this.props.node_editor.raster_data;
    var product = data.product ? data.product : null;

    if (!product && !this.props.raster_catalog.items){
      return <Panel header="Raster data">Temporarily unavailable</Panel>;
    }

    var date_error = (
      (data.errors.date_range ? data.errors.date_range : "") +
      (data.errors.date_start ? data.errors.date_start : "") +
      (data.errors.date_end ? data.errors.date_end : "")
    );

    return (
      <Panel header="Raster data">
        <form ref={(ref) => this.form=ref} onChange={() => this.onChange()}>
          <FormGroup controlId="rightSelect">
            <ControlLabel>Raster</ControlLabel>
            <RasterProductTable {...this.props}/>
            <FormControl
              name="raster" type="text" readOnly={true}
              placeholder="Select raster product to use."
              value={product ? product.name : null}
            />
          </FormGroup>
          {
            product ? (
              <FormGroup controlId="range"
                validationState={date_error ? 'error' : null}>
                <ControlLabel>Temporal&nbsp;Range</ControlLabel>
                <div className="input-group input-daterange">
                  <input
                    ref={(ref)=>{this.startpicker=ref}}
                    name="date_start" type="text" placeholder="yyyy-ddd"
                    value={data.date_start}
                  />
                  <span className="input-group-addon">to</span>
                  <input
                    ref={(ref)=>{this.endpicker=ref}}
                    name="date_end" type="text" placeholder="yyyy-ddd"
                    value={data.date_end}
                  />
                </div>
                <HelpBlock>{
                  date_error ? date_error : "Date must be entered in the form yyyy-ddd."
                }</HelpBlock>
              </FormGroup>
            ) : null
          }
          <FormGroup controlId="name"
            validationState={this.props.errors.name ? 'error' : null}>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text"
              placeholder={data.default_name}
              value={(data.name && data.name.length > 0) ? data.name : null}
            />
            <HelpBlock>
              { data.errors.name ? data.errors.name : "Name must be alphanumeric, without spaces." }
            </HelpBlock>
          </FormGroup>
          {
            data.valid ? (
              <Button onClick={() => this.onSave()}>
                {data.editing ? "Save" : "Add"}
              </Button>
            ) : null
          }
          <Button onClick={() => this.props.onEditNothing()}>Cancel</Button>
        </form>
      </Panel>
    );
  }
}

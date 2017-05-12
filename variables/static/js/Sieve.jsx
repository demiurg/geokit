const {
  Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Tabs, Tab, DropdownButton, MenuItem, Table, Glyphicon,
  Modal, FormControl, ControlLabel, FormGroup, HelpBlock,
} = ReactBootstrap;

/* app */

var initialState = Object.assign({
  id: null,
  errors: {"name": null, "tree": null},
  name: "",
  tree: [],
  description: "",
  spatial_domain: null,
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  node_editor: {mode: DEFAULT},
  tabularData: {},
  raster_data: {},
  expression_data: {},
  operandSelections: {}
}, window.sieve_props);


function sieveApp(state=initialState, action){
  switch (action.type){
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
      console.log(action.name);
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
        tree: action.tree,
        errors: Object.assign({}, state.errors, {tree: action.error})
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
        input_variables: input_variables(state.input_variables, action),
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

var mapStateToProps = (state) => {
  return Object.assign({}, state);
};

var mapDispatchToProps = (dispatch) => {
  return {
    onSaveVariable: (v, c) => {
      dispatch(saveVariable(v, c));
    },
    onUpdateName: (name, field) => {
      dispatch(updateName(name, field));
    },
    onDescriptionChange: (e) => {
      dispatch(updateDescription(e.target.value));
    },
    onSpatialDomainChange: (e) => {
      if (e == null)
        dispatch(updateSpatialDomain(null));
      else
        dispatch(updateSpatialDomain(e.value));
    },
    onUpdateTree: (tree) => {
      dispatch(updateTree(tree));
    },
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: (i) => {
      dispatch(removeInputVariable(i));
    },
    onEditInputVariable: (variable, node, i) => {
      dispatch(editInputVariable(variable, node, i));
    },
    onUpdateInputVariable: (variable, i) => {
      dispatch(updateInputVariable(variable, i));
    },
    onChangeOperandSelection: (id, value) => {
      dispatch(changeOperandSelection(id, value));
    },
    onEditNothing: () => {
      dispatch(editNothing());
    },
    onAddDataSource: () => {
      dispatch(addDataSource());
    },
    onAddExpression: () => {
      dispatch(addExpression());
    },
    onUpdateRasterData: (data) => {
      dispatch(updateRasterData(data));
    },
    onUpdateTabularData: (data) => {
      dispatch(updateTabularData(data));
    },
    onUpdateExpressionData: (data) => {
      dispatch(updateExpressionData(data));
    }
  };
};

/* components */

//  layer or table item to bare dict option
var i2o = (type, item, i) => { return (item, i) => {
  if (item.field_names){
    return item.field_names.map((field, j) => (
      <option value={
        `{"type":"${type}","name":"${item.name}","id":${item.id},"field":"${field}"}`
      }>
        {`${item.name}/${field}`}
      </option>
    ))
  }
}};

class SpatialConfiguration extends React.Component {
  componentDidMount() {
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
  }

  componentDidUpdate(prevProps) {
    if (prevProps.spatial_domain != this.props.spatial_domain) {
      if (this.geoJsonTileLayer)
        this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatial_domain) {
        this.updateMap(this.props.spatial_domain);
      }
    }
  }

  updateMap(layer_id) {
    console.log(layer_id);
    var geoJsonURL = '/layers/' + layer_id + '/{z}/{x}/{y}.json';
    this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
      clipTiles: true,
      unique: function(feature) {
        return feature.properties.id;
      }
    }, {
      style: {
        weight: 1
      },
      pointToLayer: function(feature, latlng) {
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
      success: (data, status, xhr) => {
        var bounds = [
          [data['bounds'][1], data['bounds'][0]],
          [data['bounds'][3], data['bounds'][2]]
        ];
        this.map.fitBounds(bounds);
      }
    });
  }

  render() {
    var layer_options = this.props.layers.items.map((layer) => {
      return { value: layer.id, label: layer.name };
    });

    return (
      <Panel header="Spatial configuration">
        <Select value={this.props.spatial_domain} options={layer_options}
                onChange={this.props.onSpatialDomainChange} />
        <div id="spatial-config-map" style={{height: 400, marginTop: 10}}></div>
      </Panel>
    );
  }
}

class TabularDataSource extends React.Component {
  onSave() {
    if (this.props.errors.tabularDataName)
      return; // Do not submit if there are errors
    var name = this.props.node_editor.tabular_data.name;
    if (name == null || name.length == 0){
      name = this.props.node_editor.tabular_data.defaultName;
    }

    var variable = ['named', [
      name,
      [
        'join',
        [
          this.props.node_editor.tabular_data.source1,
          this.props.node_editor.tabular_data.source2
        ]
      ]]
    ];
    var index = this.props.node_editor.tabular_data.index;
    var isEditing = this.props.node_editor.tabular_data.isEditing;

    if (isEditing){
      this.props.onUpdateInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateTabularData({
      name: "",
      source1: "",
      source2: "",
      isEditing: false,
      index: -1
    });

    this.props.onEditNothing();
  }

  componentWillReceiveProps(newProps){
    if (!newProps.node_editor.tabular_data.defaultName ||
        newProps.input_variables != this.props.input_variables
      ){
      var t1 = newProps.tables.items[0];
      if (t1){
        var source1 = {name: t1.name, field: t1.field_names[0]};
        var source2 = Object.assign({}, source1);
        var name = this.generateName(source1, source2, newProps.input_variables);
        var data = Object.assign(
          {},
          newProps.node_editor.tabular_data,
          {defaultName: name}
        );

        if (!this.props.node_editor.tabular_data.source1){
          data.source1 = source1;
        }
        if (!this.props.node_editor.tabular_data.source2){
          data.source2 = source2;
        }
        this.props.onUpdateTabularData(data);
      }
    }
  }

  generateName(source1, source2, var_list=null) {
    if (source1.name == source2.name){
      var name = source1.name + '-' + source1.field + '-' + source2.field;
    } else {
      var name = source1.name + '-' + source2.name;
    }
    name = name.replace(/_/g, "-");
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

  validate() {
    var form = $(this.form).serializeArray();
    var name = form[2]['value'];
    if (name.length > 0){
      this.props.onUpdateName(name, "tabularDataName");
    }
    var source1 = JSON.parse(form[0]['value']);
    var source2 = JSON.parse(form[1]['value']);
    var defaultName = this.generateName(source1, source2);

    var data = Object.assign(
      {},
      this.props.node_editor.tabular_data,
      {
        name: name,
        source1: source1,
        source2: source2,
        defaultName: defaultName
      }
    );

    this.props.onUpdateTabularData(data);
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

  render() {
    return (
      <Panel header="Tabular data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="formSelectSource">
            <ControlLabel>Source 1</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              value={this.sourceToString(this.props.node_editor.tabular_data.source1)}
              name="table"
            >
              {
                this.props.tables.items.map(i2o('Table')
                ).concat(
                  this.props.layers.items.map(i2o('Layer'))
                )
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="formSelectDest">
            <ControlLabel>Source 2</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="layer"
              value={this.sourceToString(this.props.node_editor.tabular_data.source2)}
            >
              {
                this.props.tables.items.map(
                  i2o('Table')
                ).concat(
                  this.props.layers.items.map(i2o('Layer'))
                )
              }
            </FormControl>
          </FormGroup>
          <FormGroup
          validationState={this.props.errors.tabularDataName ? 'error' : null}
          controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text"
              placeholder={this.props.node_editor.tabular_data.defaultName}
              value={this.props.node_editor.tabular_data.name}
            />
            <HelpBlock>
              {this.props.errors.tabularDataName ?
                this.props.errors.tabularDataName :
                "Name must be alphanumeric, without spaces."}
            </HelpBlock>
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
          <Button onClick={this.props.onEditNothing}>Cancel</Button>
        </form>
      </Panel>
    );
  }
}

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
  selectRaster(event, raster){
    var data = Object.assign(
      {},
      this.props.node_editor.raster_data,
      {raster: raster}
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
                  onClick={(event) => this.selectRaster(event, r)}>
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
  static cal_format = {
    toDisplay: function (date, format, language){
      var userTimezoneOffset = date.getTimezoneOffset() * 60000;
      var d = new Date(date.getTime() + userTimezoneOffset);
      return dateToDOY(d);
    },
    toValue: function (date, format, language){
      var d = new Date(date);
      return d;
    }
  }

  onSave() {
    if (this.props.errors.raster_data_name || this.props.errors.raster_date){
      return; // Do not submit if there are errors
    }
    var data = this.props.node_editor.raster_data;

    var name = data.name;
    if (name == null || name.length == 0){
      name = data.default_name;
    }

    var product = {
      id: data.raster.id,
      name: data.raster.description
    };

    var variable = ['named', [
      name,
      [
        'raster',
        [
          product,
          this.props.spatial_domain,
          data.temporalRangeStart + ',' + data.temporalRangeEnd
        ]
      ]
    ]];

    if (data.editing){
      this.props.onUpdateInputVariable(variable, data.index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateRasterData({
      name: "",
      raster: "",
      temporalRangeStart: "",
      temporalRangeEnd: "",
      editing: false,
      index: -1,
      defaultName: null
    });

    this.props.onEditNothing();
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

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

  componentDidMount(){
    $(this.startpicker).datepicker({
      format: this.cal_format,
      endDate: new Date()
     }).on("changeDate", (e) => {
      this.validate();
     });

    $(this.endpicker).datepicker({
      format: this.cal_format,
      endDate: new Date()
     }).on("changeDate", (e) => {
      this.validate();
     });
  }

  componentWillReceiveProps(new_props){
    if (
      !new_props.node_editor.raster_data.default_name ||
      new_props.input_variables != this.props.input_variables
    ){
      var product = new_props.raster_catalog.items[0];
      var name = this.generateName(product.id, new_props.input_variables);
      var data = Object.assign(
        {},
        new_props.node_editor.raster_data,
        {default_name: name}
      );
      if (!this.props.node_editor.raster_data.product){
        data.product = {id: product.name, };
      }
      this.props.onUpdateRasterData(data);
    }
  }

  updateDefaultName(){
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if (!name || name.length < 1){
      var raster = JSON.parse(form[0]['value']);
      var data = Object.assign(
        {},
        this.props.node_editor.raster_data,
        {defaultName: this.generateName(raster)}
      );
      this.props.onUpdateRasterData(data);
    }
  }

  updateRaster(r){

    var raster = {
      "name": r.description,
      "id": r.name,
      "start_date": r.start_date,
      "end_date": r.end_date,
    };

    var defaultName = this.generateName(raster);

    $(this.startpicker).datepicker('setStartDate', r.start_date);
    $(this.startpicker).datepicker('setEndDate', r.end_date);

    $(this.endpicker).datepicker('setStartDate', r.start_date);
    $(this.endpicker).datepicker('setEndDate', r.end_date);

    var data = Object.assign(
      {},
      this.props.node_editor.raster_data,
      {
        raster: raster,
        default_name: defaultName
      }
    );

    this.props.onUpdateRasterData(data);
  }

  validate() {
    var form = $(this.form).serializeArray();
    var name = form[2]['value'];
    var temporalRangeStart = form[0]['value'];
    var temporalRangeEnd = form[1]['value'];

    var data = Object.assign(
      {},
      this.props.node_editor.raster_data,
      {
        name: name,
        temporalRangeStart: temporalRangeStart,
        temporalRangeEnd: temporalRangeEnd,
      }
    );

    this.props.onUpdateRasterData(data);
  };

  render() {
    var data = this.props.node_editor.raster_data;
    var raster = data.raster ? data.raster : null;

    if (!raster && !this.props.raster_catalog.items){
      return <Panel header="Raster data">Temporarily unavailable</Panel>;
    }

    return (
      <Panel header="Raster data">
        <form ref={(ref) => this.form=ref} onChange={() => this.validate()}>
          <FormGroup controlId="rightSelect">
            <ControlLabel>Raster</ControlLabel>
            <RasterProductTable {...this.props}/>
            <FormControl
              name="raster" type="hidden" disabled={true}
              placeholder=""
              value={raster ? (raster.name + ': ' + raster.band) : null}
            />
          </FormGroup>
          <FormGroup controlId="range"
            validationState={this.props.errors.rasterDataTemporalRange ?
              'error' : null}>
            <ControlLabel>Temporal&nbsp;Range</ControlLabel>
            <div className="input-group input-daterange">
              <input
                ref={(ref)=>{this.startpicker=ref}}
                name="temporalRangeStart" type="text" placeholder="yyyy-ddd"
                value={data.temporalRangeStart}
              />
              <span className="input-group-addon">to</span>
              <input
                ref={(ref)=>{this.endpicker=ref}}
                name="temporalRangeEnd" type="text" placeholder="yyyy-ddd"
                value={data.temporalRangeEnd}
              />
            </div>
            <HelpBlock>
              {this.props.errors.rasterDataTemporalRange ?
                this.props.errors.rasterDataTemporalRange :
                "Date must be entered in the form yyyy-ddd."}
            </HelpBlock>
          </FormGroup>
          <FormGroup controlId="name"
            validationState={this.props.errors.raster_data_name ? 'error' : null}>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text"
              placeholder={data.defaultName}
              value={data.name}
            />
            <HelpBlock>
              {this.props.errors.raster_data_name ?
                this.props.errors.raster_data_name :
                  "Name must be alphanumeric, without spaces."}
            </HelpBlock>
          </FormGroup>
          <Button onClick={() => this.onSave()}>
            {this.props.node_editor.editing ? "Save" : "Add"}
          </Button>
          <Button onClick={() => this.props.onEditNothing()}>Cancel</Button>
        </form>
      </Panel>
    );
  }
}

class OperandChooser extends React.Component {
  changeOperand(e) {
    var operand_refs = this.props.node_editor.expression_data.operand_refs;

    var operand_ref = e ? e.value : null;
    operand_refs[this.props.operand_index] = operand_ref;

    var expressionData = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {operand_refs: operand_refs}
    );
    this.props.onUpdateExpressionData(expressionData);
  }

  options() {
    var valid_input_vars = this.props.tree.validOperands(
      this.props.input_variables,
      this.props.node_editor.expression_data.operand_refs,
      this.props.operand_index
    );

    return valid_input_vars.map(input_var => {
      return {value: input_var.name, label: input_var.name};
    });
  }

  render() {
    return (
      <div style={{display: "inline-block", width: 400}}>
        <Select onChange={this.changeOperand.bind(this)}
                value={this.props.node_editor.expression_data.operand_refs[this.props.operand_index]}
                options={this.options()}
                clearable={true} />
      </div>
    );
  }
}

class TreeViewer extends React.Component {
  render() {
    var operand_inputs = [];
    for (var i = 0; i < this.props.tree.arity; i++) {
      operand_inputs.push(<OperandChooser {...this.props} operand_index={i} />);
    }

    return (
      <span>{this.props.tree.name} ( {operand_inputs} )</span>
    );
  }
}

class ExpressionEditor extends React.Component {
  constructor(props) {
    super(props);

    var data = {defaultName: this.generateName(props.input_variables)};
    props.onUpdateExpressionData(data);
  }

  componentWillReceiveProps(newProps) {
    if (
      !newProps.node_editor.expression_data.defaultName ||
        newProps.input_variables != this.props.input_variables
    ) {
      var data = {defaultName: this.generateName(newProps.input_variables)};
      this.props.onUpdateExpressionData(data);
    }
  }

  generateName(var_list=null) {
    var i =1;
    var input_variables = [];
    if (var_list) {
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach((input) => {
      if (input.name == 'expression-' + i) {
        i++;
      }
    });
    return 'expression-' + i;
  }

  changeName(e) {
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {name: e.target.value}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  addOp(op) {
    var node_object = treeToNode(op);
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {node: op, operand_refs: Array(node_object.arity)}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  populateOperands(arity) {
    var operands = [];

    for (var i = 0; i < arity; i++) {
      var operand_tree = this.props.input_variables.filter((input_var) => {
        return input_var.name == this.props.node_editor.expression_data.operand_refs[i];
      })[0].node;

      operands.push(operand_tree);
    }

    return operands;
  }

  onSave() {
    var expression_data = this.props.node_editor.expression_data;
    if (DataNode.isNode(expression_data.node)) {
      if (!expression_data.name || expression_data.name == "") {
        expression_data.name = expression_data.defaultName;
      }

      var node = treeToNode(expression_data.node);
      if (node.type == 'named'){
        node.name = expression_data.name;
      }else{
        node = DataNode.namedNode(expression_data.name, node);
      }
      expression_data.node[1] = this.populateOperands(node.arity);

      this.props.onUpdateExpressionData(
        {
          node: node,
          operand_refs: []
        }
      );
      this.props.onAddInputVariable(expression_data);
      this.props.onEditNothing();
    }
  }

  render() {
    return (
      <Panel header="Expression editor">
        <FormGroup controlId="name">
          <FormControl componentClass="input"
            placeholder={this.props.node_editor.expression_data.defaultName}
            onChange={this.changeName.bind(this)}
            value={this.props.node_editor.expression_data.name} />
        </FormGroup>
        <Panel>
          <div className="pull-right">
            <ButtonGroup>
              <Button onClick={this.addOp.bind(this, ['+', [null, null]])}>+</Button>
              <Button onClick={this.addOp.bind(this, ['-', [null, null]])}>-</Button>
              <Button onClick={this.addOp.bind(this, ['*', [null, null]])}>*</Button>
              <Button onClick={this.addOp.bind(this, ['/', [null, null]])}>/</Button>
              <Button onClick={this.addOp.bind(this, ['tmean', [null]])}>Temporal Mean</Button>
              <Button onClick={this.addOp.bind(this, ['smean', [null]])}>Spatial Mean</Button>
            </ButtonGroup>
          </div>
        </Panel>
        <Panel>
          <TreeViewer {...this.props} tree={treeToNode(this.props.node_editor.expression_data.node)} />
        </Panel>
        <Button onClick={this.onSave.bind(this)}>Add</Button>
        <Button onClick={this.props.onEditNothing}>Cancel</Button>
      </Panel>
    );
  }
}

class VariableTable extends React.Component {
  useInputVariable = (item, name) => {
    if (!this.props.name){
      this.props.onUpdateName(name)
    }
    this.props.onUpdateTree(item);
  }

  render() {
    if (this.props.input_variables.length > 0){
      var table = (
        <Table striped>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.input_variables.map((item, i) => {
              var node = treeToNode(item);

              return (
                <tr>
                  <td>{node.name}</td>
                  <td>{node.type}</td>
                  <td>{node.dimensions}</td>
                  <td>
                    <Button onClick={
                      () => this.useInputVariable(item, node.name)
                    }>Use</Button>
                    <Button onClick={
                      () => this.props.onEditInputVariable(node, i)
                    }>Edit</Button>
                  </td>
                  <td>
                    <Button
                        onClick={() => {this.props.onRemoveInputVariable(i)}}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      );
    } else {
      table = <p></p>;
    }
    return (
      <Panel header="Variables">
        <div className="pull-right">
          <Button disabled={!this.props.spatial_domain || this.props.input_variables.length == 0}
                  onClick={() => this.props.onAddExpression()}>
            Add Expression
          </Button>
          <Button disabled={!this.props.spatial_domain}
                  onClick={() => this.props.onAddDataSource()}>
            Add Data Source
          </Button>
        </div>
        {table}
      </Panel>
    );
  }
}

var node2tree  = (node) => {
  var buildTree = (node, tree, branch) => {
    if (branch[0] == 'const'){
      tree.push(branch[1]);
      return tree;
    } else {
      tree.push(branch[0]);
      var subPaths = branch[1];
      var subBranch = [];
      subPaths.forEach((element) => {
        buildTree(node, subBranch, node[element]);
      });
      tree.push(subBranch);
      return tree;
    };
  }
  return buildTree(node, [], node[0]);
}

class AddDataSourcePanel extends React.Component {
  render() {
    return (
      <Panel header="Add a data source">
        <Row>
          <Col md={6}>
            <Button
              onClick={this.props.onUpdateTabularData}
              style={{width: '100%', margin: '0.83em 0'}}>
              <Glyphicon glyph="user" /> I want to use a user-submitted table
            </Button>
          </Col>
          <Col md={6}>
            <h2>Tabular Data</h2>
            <p>GeoKit users can provide specially formatted tabular data that GeoKit can use to render visualizations.</p>
            <p>Do you want to create a tabular data based visualization, but haven't uploaded your data yet?</p>
            <a href="#" className="button pull-right">Create some tabular data</a>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Button
              onClick={this.props.onUpdateRasterData}
              style={{width: '100%', margin: '0.83em 0'}}>
              <Glyphicon glyph="cloud" /> I want to use GeoKit data
            </Button>
          </Col>
          <Col md={6}>
            <h2>Raster Data</h2>
            <p>GeoKit provides a service for reducing vast quantities of observational data to quantities that are practical for use in web applications for visualizing information about Earth.</p>
            <p>GeoKit raster data doesn't require any special setup beyond a small configuration step. Depending on the amount of data requested, the reduction procedure can take some time. Check the variables page to see information about the status of your variables.</p>
          </Col>
        </Row>
        <Button onClick={this.props.onEditNothing}>Cancel</Button>
      </Panel>
    );
  }
}

class SieveComponent extends React.Component {
  saveVariable = () => {
    this.props.onSaveVariable({
      id: this.props.id,
      name: this.props.name,
      tree: this.props.tree,
      input_variables: this.props.input_variables,
      description: this.props.description
    }, this.props.created);
  };

  renderMiddlePanel() {
    if (this.props.spatial_domain) {
      switch (this.props.node_editor.mode) {
        case EDITING_EXPRESSION:
          return <ExpressionEditor {...this.props} />;
        case EDITING_RASTER_DATA:
          return <RasterDataSource {...this.props} />;
        case EDITING_TABULAR_DATA:
          return <TabularDataSource {...this.props} />;
        case ADDING_DATA_SOURCE:
          return <AddDataSourcePanel {...this.props} />;
        default:
          return null;
      }
    }
  }

  render() {
    var final_render = null;
    this.props.name;
    if (this.props.tree && this.props.tree.length) {
      var final = treeToNode(this.props.tree);
      final_render = <div>
        <input
          ref={(ref)=>{this.endpicker=ref}}
          name="name" type="text"
          value={this.props.name}
        />
        <p>{final.render()}</p>
        <p>
          {this.props.changed ?
            <button className='button button-secondary' onClick={this.saveVariable}>Save Changes</button>
          : null}
          {this.props.id ?
            <a href={`/admin/variables/delete/${this.props.id}`} className='button serious'>Delete</a>
          : null}
        </p>
      </div>;
    } else {
      final_render = <p>Use controls to build and use the variable</p>;
    }
    return (
      <div className="sieve">
        <Row className="show-grid">
          <Col xs={11}>
            <SpatialConfiguration {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            {this.renderMiddlePanel()}
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <VariableTable {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <Panel header={<h3>Final {final ? final.dimensions : ''} variable</h3>}>
              {final_render}
            </Panel>
          </Col>
        </Row>
      </div>
    );
  }
}


var Sieve = ReactRedux.connect(
  mapStateToProps,
  mapDispatchToProps
)(SieveComponent);


function sieve(el){
  var store = Redux.createStore(
    sieveApp,
    Redux.applyMiddleware(ReduxThunk.default)
  );

  store.dispatch(fetchLayers());
  store.dispatch(fetchTables());
  store.dispatch(fetchVariables());
  store.dispatch(receiveRasterCatalog(window.raster_catalog));
  store.dispatch(receiveInputVariables(window.sieve_props.input_variables));

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

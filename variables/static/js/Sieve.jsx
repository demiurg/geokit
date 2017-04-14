const {
  Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Tabs, DropdownButton, MenuItem, Table,
  Modal, FormControl, ControlLabel, FormGroup, HelpBlock
} = ReactBootstrap;

/* app */

var initialState = Object.assign({
  errors: {"name": null, "tree": null},
  name: "",
  tree: {},
  description: "",
  spatialDomain: null,
  temporalDomain: {start: null, end: null},
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  editingTabularData: {},
  editingRasterData: {},
  editingExpressionData: {},
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
        errors: Object.assign({}, state.errors, {tree: action.error})
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
      var errors = {}
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
    case EDIT_RASTER_DATA:
      return Object.assign({}, state, {
        editingRasterData: action.data
      });
    case EDIT_TABULAR_DATA:
      return Object.assign({}, state, {
        editingTabularData: action.data
      });
    case EDIT_EXPRESSION_DATA:
      return Object.assign({}, state, {
        editingExpressionData: action.data
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
    onNameChange: (name, field) => {
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
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: (i) => {
      dispatch(removeInputVariable(i));
    },
    onEditInputVariable: (variable, i) => {
      dispatch(editInputVariable(variable, i));
    },
    onInitTree: (node) => {
      dispatch(initTree(node));
    },
    onEditTreeNode: (id, node) => {
      dispatch(editTreeNode(id, node));
    },
    onChangeOperandSelection: (id, value) => {
      dispatch(changeOperandSelection(id, value));
    },
    onEditRasterData: (data) => {
      dispatch(editRasterData(data));
    },
    onEditTabularData: (data) => {
      dispatch(editTabularData(data));
    },
    onEditExpressionData: (data) => {
      dispatch(editExpressionData(data));
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
  }

  componentDidUpdate(prevProps) {
    if (prevProps.spatialDomain != this.props.spatialDomain) {
      if (this.geoJsonTileLayer)
        this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatialDomain) {
        var geoJsonURL = '/layers/' + this.props.spatialDomain + '/{z}/{x}/{y}.json';
        this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
          clipTiles: true,
          unique: function(feature) {
            return feature.properties.id;
          }
        }, {
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

        $.ajax('/api/layers/' + this.props.spatialDomain, {
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
    }
  }

  render() {
    var layer_options = this.props.layers.items.map((layer) => {
      return { value: layer.id, label: layer.name };
    });

    return (
      <Panel header="Spatial configuration">
        <Select value={this.props.spatialDomain} options={layer_options}
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
    var name = this.props.editingTabularData.name;
    if (name == null || name.length == 0){
      name = this.props.editingTabularData.defaultName;
    }

    var variable = {
      name: name,
      node: [
        'join',
        [
          this.props.editingTabularData.source1,
          this.props.editingTabularData.source2
        ]
      ]
    };
    var index = this.props.editingTabularData.index;
    var isEditing = this.props.editingTabularData.isEditing;

    if (isEditing){
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
  }

  componentWillReceiveProps(newProps){
    if (!newProps.editingTabularData.defaultName ||
        newProps.input_variables != this.props.input_variables
      ){
      var t1 = newProps.tables.items[0];
      if (t1){
        var source1 = {name: t1.name, field: t1.field_names[0]};
        var source2 = Object.assign({}, source1);
        var name = this.generateName(source1, source2, newProps.input_variables);
        var data = Object.assign(
          {},
          newProps.editingTabularData,
          {defaultName: name}
        );

        if (!this.props.editingTabularData.source1)
          data.source1 = source1;
        if (!this.props.editingTabularData.source2)
          data.source2 = source2;


         this.props.onEditTabularData(data);
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
    var unique = false;
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
    if (name.length > 0)
      this.props.onNameChange(name, "tabularDataName");
    var source1 = JSON.parse(form[0]['value']);
    var source2 = JSON.parse(form[1]['value']);
    var defaultName = this.generateName(source1, source2);

    var data = Object.assign(
      {},
      this.props.editingTabularData,
      {
        name: name,
        source1: source1,
        source2: source2,
        defaultName: defaultName
      }
    );

    this.props.onEditTabularData(data);
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
              value={this.sourceToString(this.props.editingTabularData.source1)}
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
              value={this.sourceToString(this.props.editingTabularData.source2)}
            >
              {
                this.props.tables.items.map(i2o('Table')
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
              placeholder={this.props.editingTabularData.defaultName}
              value={this.props.editingTabularData.name}
            />
            <HelpBlock>
              {this.props.errors.tabularDataName ?
                this.props.errors.tabularDataName :
                "Name must be alphanumeric, without spaces."}
            </HelpBlock>
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
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

class RasterDataSource extends React.Component {
  onSave() {
    if (this.props.errors.rasterDataName || this.props.errors.rasterDate)
      return; // Do not submit if there are errors

    var name = this.props.editingRasterData.name;
    if (name == null || name.length == 0){
      name = this.props.editingRasterData.defaultName;
    }

    var variable = {
      name: name,
      node: [
        'raster',
        [
          this.props.editingRasterData.raster,
          this.props.spatialDomain,
          this.props.editingRasterData.temporalRangeStart + ',' +
          this.props.editingRasterData.temporalRangeEnd
        ]
      ]
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

    if (isEditing){
      this.props.onEditInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

  generateName(raster, var_list=null) {
    var name = raster.id.replace(/_/g, "-");
    var i = 1;

    var unique = false;
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
    var format = {
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

    $(this.startpicker).datepicker({
      format: format
     }).on("changeDate", (e) => {
      this.validate();
     });

    $(this.endpicker).datepicker({
      format: format
     }).on("changeDate", (e) => {
      this.validate();
     });
  }

  componentWillReceiveProps(newProps){
    if (!newProps.editingRasterData.defaultName ||
        newProps.input_variables != this.props.input_variables
      ){
      var raster = newProps.raster_catalog.items[0];
      var raster2 = Object.assign({}, raster, {id: raster.name});
      var name = this.generateName(raster2, newProps.input_variables);
      var data = Object.assign(
        {},
        newProps.editingRasterData,
        {defaultName: name}
      );
      if (!this.props.editingRasterData.raster)
        data.raster = raster;
      this.props.onEditRasterData(data);
    }
  }

  updateDefaultName(){
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if (!name || name.length < 1){
      var raster = JSON.parse(form[0]['value']);
      var data = Object.assign(
        {},
        this.props.editingRasterData,
        {defaultName: this.generateName(raster)}
      );
      this.props.onEditRasterData(data);
    }
  }

  validate() {
    var form = $(this.form).serializeArray();
    var name = form[3]['value'];
    if( name.length > 0)
      this.props.onNameChange(name, "rasterDataName");
    var raster = JSON.parse(form[0]['value']);
    var temporalRangeStart = form[1]['value'];
    var temporalRangeEnd = form[2]['value'];
    var defaultName = this.generateName(raster);

    var data = Object.assign(
      {},
      this.props.editingRasterData,
      {
        name: name,
        raster: raster,
        temporalRangeStart: temporalRangeStart,
        temporalRangeEnd: temporalRangeEnd,
        defaultName: defaultName
      }
    );

    this.props.onEditRasterData(data);
  };

  render() {
    return (
      <Panel header="Raster data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="rightSelect">
            <ControlLabel>Raster</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="right"
              value={this.sourceToString(this.props.editingRasterData.raster)}
            >
              {
                this.props.raster_catalog.items.map((r, i) => (
                  <option key={i} value={
                    `{"name":"${r.description}","id":"${r.name}"}`
                  }>
                    {r.description + ': ' + r.band}
                  </option>
                ))
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="range"
            validationState={this.props.errors.rasterDataTemporalRange ?
              'error' : null}>
            <ControlLabel>Temporal&nbsp;Range</ControlLabel>
            <div class="input-group input-daterange">
            <input
              ref={(ref)=>{this.startpicker=ref}}
              name="temporalRangeStart" type="text" placeholder="yyyy-ddd"
              value={this.props.editingRasterData.temporalRangeStart}
            />
            <span class="input-group-addon">to</span>
            <input
              ref={(ref)=>{this.endpicker=ref}}
              name="temporalRangeEnd" type="text" placeholder="yyyy-ddd"
              value={this.props.editingRasterData.temporalRangeEnd}
            />
            </div>
            <HelpBlock>
              {this.props.errors.rasterDataTemporalRange ?
                this.props.errors.rasterDataTemporalRange :
                "Date must be entered in the form yyyy-ddd."}
            </HelpBlock>
          </FormGroup>
          <FormGroup controlId="name"
            validationState={this.props.errors.rasterDataName ? 'error' : null}>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text"
              placeholder={this.props.editingRasterData.defaultName}
              value={this.props.editingRasterData.name}
            />
            <HelpBlock>
              {this.props.errors.rasterDataName ?
                this.props.errors.rasterDataName :
                  "Name must be alphanumeric, without spaces."}
            </HelpBlock>
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
        </form>
      </Panel>
    );
  }
}

class OperandChooser extends React.Component {
  changeOperand(e) {
    var operand_refs = this.props.editingExpressionData.operand_refs;
    operand_refs[this.props.operand_index] = e.value;
    
    var expressionData = Object.assign(
      {},
      this.props.editingExpressionData,
      {operand_refs: operand_refs}
    );
    this.props.onEditExpressionData(expressionData);
  }

  render() {
    var options = this.props.input_variables.map(input_var => { return {value: input_var.name, label: input_var.name}; });
    return (
      <div style={{display: "inline-block", width: 400}}>
        <Select onChange={this.changeOperand.bind(this)}
                value={this.props.editingExpressionData.operand_refs[this.props.operand_index]}
                options={options}
                clearable={false} />
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
  changeName(e) {
    var expressionData = Object.assign(
      {},
      this.props.editingExpressionData,
      {name: e.target.value}
    );
    this.props.onEditExpressionData(expressionData);
  }

  addOp(op) {
    var node_object = treeToNode(op);
    var expressionData = Object.assign(
      {},
      this.props.editingExpressionData,
      {node: op, operand_refs: Array(node_object.arity)}
    );
    this.props.onEditExpressionData(expressionData);
  }

  populateOperands(arity) {
    var operands = [];

    for (var i = 0; i < arity; i++) {
      var operand_tree = this.props.input_variables.filter((input_var) => {
        return input_var.name == this.props.editingExpressionData.operand_refs[i];
      })[0].node;

      operands.push(operand_tree);
    }

    return operands;
  }

  onSave() {
    var expressionData = this.props.editingExpressionData;
    if (expressionData.name && expressionData.name.length > 0 &&
        expressionData.node && expressionData.node.length == 2) {

      var node = treeToNode(expressionData.node);
      expressionData.node[1] = this.populateOperands(node.arity);

      this.props.onEditExpressionData({name: "", node: [], operand_refs: []});
      this.props.onAddInputVariable(expressionData);
    }
  }

  render() {
    return (
      <Panel header="Expression editor">
        <FormGroup controlId="name">
          <FormControl componentClass="input"
            placeholder="Name..."
            onChange={this.changeName.bind(this)}
            value={this.props.editingExpressionData.name} />
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
          <TreeViewer {...this.props} tree={treeToNode(this.props.editingExpressionData.node)} />
        </Panel>
        <Button onClick={this.onSave.bind(this)}>Add</Button>
      </Panel>
    );
  }
}

class VariableTable extends React.Component {
  onUseVariable(variable) {
    this.props.onSaveVariable({
      id: this.props.id,
      name: variable.name,
      tree: variable.node,
      input_variables: this.props.input_variables,
      description: this.props.description,
      temporal_domain: this.props.temporal_domain,
      spatial_domain: this.props.spatial_domain
    });
  }

  render() {
    if (this.props.input_variables.length > 0){
      var item = this.props.input_variables[0];
    }
    return (
      <Panel header="Variables">
        <Table striped>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.input_variables.map( (item, i) => {
              var type = item.node[0];
              var operator = treeToNode(item.node);
              return(
                <tr>
                  <td>{item.name}</td>
                  <td>{item.node[0]}</td>
                  <td>{operator.dimensions}</td>
                  <td>
                    <Button onClick={this.onUseVariable.bind(this, item)}>Use</Button>
                    <Button
                      onClick={ () => {
                        if (item.node[0] == "join"){
                          var source1 = item.node[1][0]
                          var source2 = item.node[1][1]
                          this.props.onEditTabularData({
                            name: item.name,
                            source1: source1,
                            source2: source2,
                            isEditing: true,
                            index: i
                          });
                        } else if (item.node[0] == "raster"){
                          var raster = item.node[1][0];
                          var temporalRange = item.node[1][2].split(",");

                          this.props.onSpatialDomainChange(
                            {value: item.node[1][1]}
                          );
                          this.props.onEditRasterData({
                            name: item.name,
                            raster: raster,
                            temporalRangeStart: temporalRange[0],
                            temporalRangeEnd: temporalRange[1],
                            isEditing: true,
                            index: i
                          });
                        }
                      }}>
                      Edit
                    </Button>
                  </td>
                  <td>
                    <Button
                        onClick={() => {this.props.onRemoveInputVariable(i)}}>
                        Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
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

class SieveComponent extends React.Component {
  render() {
    var self = this;

    function createMarkup() { return {__html: treeToNode(self.props.tree).html(0)}; };
    function returnHTML(html) { return {__html: html}};

    var onSave = (e) => {
      e.stopPropagation();
      if (self.props.errors.name || self.props.errors.tree){
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

    return (
      <div className="sieve">
        <Row className="show-grid">
          <Col xs={11}>
            <SpatialConfiguration {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={5}>
            <TabularDataSource {...this.props} />
          </Col>
          <Col xs={5} xsOffset={1}>
            <RasterDataSource {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <ExpressionEditor {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <VariableTable {...this.props} />
          </Col>
        </Row>
      </div>
    );
  }
}

var tab = (level) => {return Array(level * 4).join("&nbsp;")};
var formatHtml = (html, level) => {return tab(level) + html;};


class DataNode {
  json() {
    return JSON.encode(data);
  }
}

class MeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Mean';
    this.arity = 2;

    if (operands.length != this.arity) {
        throw Error(`MeanOperator takes exactly ${this.arity} operands`);
    }

    this.left = treeToNode(operands[0]);
    this.right = treeToNode(operands[1]);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['mean', [this.left.json(), this.right.json()]];
  }
}

class TemporalMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Temporal Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`TemporalMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'space';
  }

  json() {
    return ['tmean', [this.operand.json()]];
  }
}

class SpatialMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Spatial Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`SpatialMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'time';
  }

  json() {
    return ['smean', [this.operand.json()]];
  }
}

class SelectOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Select';
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`SelectOperator takes exactly ${this.arity} operands`);
    }

    this.left = treeToNode(operands[0]);
    this.child_op = operands[0][0];
    this.right = operands[1];

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['select', [this.left.json(), this.right.json()]];
  }
}

class ExpressionOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Expression';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`"ExpressionOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = this.operand.dimensions;
  }

  json() {
    return ['expression', [this.operand.json()]];
  }
}

class JoinOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Join';
    this.arity = 2

    if (operands.length != this.arity) {
      throw Error(`JoinOperator takes exactly ${this.arity} operands`);
    }

    this.left = new SourceOperator([operands[0]]);
    this.right = new SourceOperator([operands[1]]);

    var dimensions = new Set();
    dimensions.add(this.left.dimensions);
    dimensions.add(this.right.dimensions);

    this.dimensions = '';
    if (dimensions.has('space')) {
      this.dimensions += 'space';
    }
    if (dimensions.has('time')) {
      this.dimensions += 'time';
    }
  }

  json() {
    return ['join', [this.left.json(), this.right.json()]];
  }
}

class RasterOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Raster';
    this.arity = 3;

    if (operands.length != this.arity) {
      throw Error(`RasterOperator takes exactly ${this.arity} operands`);
    }

    this.left = operands[0];
    this.middle = operands[2];
    this.right = treeToNode(operands[1]);

    this.dimensions = 'spacetime';
  }

  json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  }
}

class SourceOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name= 'Source';
    this.arity = 1

    if (operands.length != this.arity) {
      throw Error(`SourceOperator takes exactly ${this.arity} operand`);
    }

    this.operand = operands[0];
    this.source_name = this.operand.name;
    this.type = this.operand['type'];
    this.field = this.operand.field;

    if (this.type == 'Layer') {
      this.dimensions = 'space';
    } else if (this.type == 'Table') {
      this.dimensions = 'time';
    }
  }

  json() {
    return ['source', [{source_name: this.name, type: this.type, field: this.field}]];
  }
}

class MathOperator extends React.Component {
  constructor(operator, operands) {
    super(operands);

    this.operator = operator;
    this.name = operator;
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`MathOperator takes exactly ${this.arity} operands`);
    }

    this.left = treeToNode(operands[0]);
    this.right = treeToNode(operands[1]);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    this.dimensions = this.left.dimensions;
  }

  json() {
    return [this.operator, [this.left.json(), this.right.json()]];
  }
}

class EmptyTree extends DataNode {
  constructor(props) {
    super(props);

    this.name = 'Empty';
    this.arity = 0;
  }

  render() {
    return null;
  }
}

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
  store.dispatch(receiveRasterCatalog(raster_catalog));

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

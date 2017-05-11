'use strict';

const REQUEST_LAYERS = 'REQUEST_LAYERS';
const RECEIVE_LAYERS = 'RECEIVE_LAYERS';

const REQUEST_TABLES = 'REQUEST_TABLES';
const RECEIVE_TABLES = 'RECEIVE_TABLES';

const RECEIVE_RASTER_CATALOG = 'RECEIVE_RASTER_CATALOG';

const RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
const REQUEST_VARIABLES = 'REQUEST_VARIABLES';

const RECEIVE_INPUT_VARIABLES = 'RECEIVE_INPUT_VARIABLES';

const UPDATE_NAME = 'UPDATE_NAME';
const UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
const UPDATE_SPATIAL_DOMAIN = 'UPDATE_SPATIAL_DOMAIN';
const UPDATE_TREE = 'UPDATE_TREE';
const UPDATE_ERRORS = 'UPDATE_ERRORS';
const UPDATE_MODIFIED = 'UPDATE_MODIFIED';
const UPDATE_CREATED = 'UPDATE_CREATED';


const REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
const ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';
const UPDATE_INPUT_VARIABLE = 'UPDATE_INPUT_VARIABLE';
const ERROR_INPUT_VARIABLE = 'ERROR_INPUT_VARIABLE';

const INIT_TREE = 'INIT_TREE';
const EDIT_TREE_NODE = 'EDIT_TREE_NODE';

const CHANGE_OPERAND_SELECTION = 'CHANGE_OPERAND_SELECTION';

const SAVE_VARIABLE = 'SAVE_VARIABLE';
const POST_VARIABLE = 'POST_VARIABLE';
const RECIEVE_VARIABLE = 'RECIEVE_VARIABLE';

const EDIT_NODE = 'EDIT_NODE';


function requestLayers() {
  return {
    type: REQUEST_LAYERS
  };
}


function receiveLayers(json){
  return {
    type: RECEIVE_LAYERS,
    layers: json,
    receivedAt: Date.now()
  };
}

function receiveRasterCatalog(json){
  return {
    type: RECEIVE_RASTER_CATALOG,
    raster_catalog: json,
    receivedAt: Date.now()
  };
}

function fetchLayers(){
  return function(dispatch){
    dispatch(requestLayers());

    return $.ajax({
      url: '/api/layers?status=0',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveLayers(data));
      },
      error: function(xhr, status, err) {
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

function receiveTables(json){
  return {
    type: RECEIVE_TABLES,
    tables: json,
    receivedAt: Date.now()
  };
}

function fetchTables(){
  return function(dispatch){
    dispatch(requestTables());

    return $.ajax({
      url: '/api/tables?status=0',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveTables(data));
      },
      error: function(xhr, status, err) {
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

function receiveVariables(json){
  return {
    type: RECEIVE_VARIABLES,
    variables: json,
    receivedAt: Date.now()
  };
}

function fetchVariables(){
  return function(dispatch){
    dispatch(requestVariables());

    return $.ajax({
      url: '/api/variables',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveVariables(data));
      },
      error: function(xhr, status, err) {
        console.error(xhr.url, status, err.toString());
      }
    });
  };
}

let nextVariableId = 0;

function validateRaster(raster){
  var range = raster[1][2];
  var raster = raster[1][0];

  // Date conversion hell
  var d1 = new Date(raster.start_date);
  var d2 = new Date(raster.end_date);
  var userTimezoneOffset = d1.getTimezoneOffset() * 60000;
  var raster_start_date = new Date(d1.getTime() + userTimezoneOffset);
  var raster_end_date = new Date(d2.getTime() + userTimezoneOffset);

  if (range.includes("undefined")){
    return "Start and end date must be specified.";
  } else if (!range.match(/\d{4}-\d{3},\d{4}-\d{3}/g)){
    return "Date must be entered in the form yyyy-ddd.";
  }

  var range_start = range.split(',')[0];
  var range_end = range.split(',')[1];

  var doy_start = parseInt(range_start.split('-')[1]);
  var year_start = parseInt(range_start.split('-')[0]);
  var range_start_date = new Date(year_start, 0);
  range_start_date.setDate(doy_start);

  var doy_end = parseInt(range_end.split('-')[1]);
  var year_end = parseInt(range_end.split('-')[0]);
  var range_end_date = new Date(year_end, 0);
  range_end_date.setDate(doy_end);

  if (range_start_date < raster_start_date){
    return "Start date must be after " + raster_start_date.toDateString();
  } else if (range_end_date > raster_end_date){
    return "End date must be before " + raster_end_date.toDateString();
  }


  return null;
}

function receiveInputVariables(input_variables) {
  if (!input_variables) {
    return {
      type: RECEIVE_INPUT_VARIABLES,
      input_variables: [],
      spatial_domain: null
    };
  } else {
    var last_input_var = input_variables[input_variables.length - 1];

    var input_var_layers = treeToNode(last_input_var).layers,
        spatial_domain = null;
    if (input_var_layers) {
      spatial_domain = input_var_layers[input_var_layers.length - 1].operand.id;
    }
    
    return {
      type: RECEIVE_INPUT_VARIABLES,
      input_variables: input_variables,
      spatial_domain: spatial_domain
    };
  }
}

function addInputVariable(node){
  var inputType = node[0];
  var error = null;

  if (inputType == 'raster'){
    error = validateRaster(node);
  }
  if (error){
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

function editInputVariable(node, i){
  return function(dispatch){
    if (node.type == "join"){
      dispatch(editTabularData({
        name: node.name,
        source1: node.left,
        source2: node.right,
        isEditing: true,
        index: i
      }));
    } else if (node.type == "raster"){
      dispatch(updateSpatialDomain(node.layer.id));
      dispatch(editRasterData({
        name: node.name,
        raster: node.product,
        temporalRangeStart: node.start,
        temporalRangeEnd: node.end,
        isEditing: true,
        index: i
      }));
    } else {
      dispatch(editExpressionData({
        name: node.name,
        index: i,
        isEditing: true,
        node: node
      }));
    }
  }
}

function updateInputVariable(variable, idx){
  return {
    type: UPDATE_INPUT_VARIABLE,
    index: idx,
    variable
  };
}

function removeInputVariable(idx){
  return {
    type: REMOVE_INPUT_VARIABLE,
    index: idx
  }
}

function initTree(node){
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

function updateName(name, field){
  var error = null;
  if (!name || !name.match(/^[a-zA-Z0-9-]+$/)){
    error = "Name is not alphanumeric or contains spaces.";
  }
  return {
    type: UPDATE_NAME,
    name: name,
    field: field,
    error: error
  };
}

function updateDescription(description){
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

function recieveVariable(json){
  return {
    type: RECIEVE_VARIABLE,
    variable: json,
    receivedAt: Date.now()
  };
}

function updateErrors(errors={"name": null, "tree": null}){
  return {
    type: UPDATE_ERRORS,
    errors: errors
  };
}

function updateModified(time=null){
  return {
    type: UPDATE_MODIFIED,
    time
  };
}

function updateCreated(time=null){
  return {
    type: UPDATE_CREATED,
    time
  };
}

function updateTree(tree){
  return {
    type: UPDATE_TREE,
    tree: tree
  }
}

function saveVariable(variable, created){
  return function(dispatch){
    dispatch(postVariable());

    return $.ajax({
      url: '/api/variables/' + (created ? variable.id + '/' : ''),
      dataType: 'json',
      cache: 'false',
      data: JSON.stringify(variable),
      method: created ? 'PATCH' : 'POST',
      contentType: "application/json",
      processData: false,
      success: function(data) {
        if(!created){
          dispatch(updateCreated(data.created));
        }else{
          dispatch(updateModified(data.modified));
        }
        dispatch(updateErrors());
      },
      error: function(xhr, status, err) {
        var server_errors = xhr.responseJSON;
        var errors = {};
        if (server_errors){
          var keys = Object.keys(server_errors);
          for (var i=0; i<keys.length; i++){
            var error = '';
            if (Array.isArray(server_errors[keys[i]])){
              error = server_errors[keys[i]].join(' ');
            }else{
              error = server_errors[keys[i]];
            }
            errors[keys[i]] = error;
          }
        }else{
          errors['detail'] = err;
        }
        dispatch(updateErrors(errors));
      }
    });
  };
}


function editTabularData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_TABULAR_DATA,
    data: data
  };
}

function editRasterData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_RASTER_DATA,
    data: data
  };
}

function editExpressionData(data) {
  return {
    type: EDIT_NODE,
    mode: EDITING_EXPRESSION,
    data: data
  };
}

function addDataSource(){
  return {
    type: EDIT_NODE,
    mode: ADDING_DATA_SOURCE,
    data: {},
  }
}

function addExpression(){
  return {
    type: EDIT_NODE,
    mode: EDITING_EXPRESSION,
    data: {},
  }
}

function editNothing(){
  return {
    type: EDIT_NODE,
    mode: DEFAULT,
    data: {},
  }
}

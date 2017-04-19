'use strict';

const REQUEST_LAYERS = 'REQUEST_LAYERS';
const RECEIVE_LAYERS = 'RECEIVE_LAYERS';

const REQUEST_TABLES = 'REQUEST_TABLES';
const RECEIVE_TABLES = 'RECEIVE_TABLES';

const RECEIVE_RASTER_CATALOG = 'RECEIVE_RASTE_CATALOG';

const RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
const REQUEST_VARIABLES = 'REQUEST_VARIABLES';

const UPDATE_NAME = 'UPDATE_NAME';
const UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
const UPDATE_SPATIAL_DOMAIN = 'UPDATE_SPATIAL_DOMAIN';
const UPDATE_TREE = 'UPDATE_TREE';
const UPDATE_ERRORS = 'UPDATE_ERRORS';
const UPDATE_MODIFIED = 'UPDATE_MODIFIED';
const UPDATE_CREATED = 'UPDATE_CREATED';


const REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
const ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';
const EDIT_INPUT_VARIABLE = 'EDIT_INPUT_VARIABLE';
const ERROR_INPUT_VARIABLE = 'ERROR_INPUT_VARIABLE';

const INIT_TREE = 'INIT_TREE';
const EDIT_TREE_NODE = 'EDIT_TREE_NODE';

const CHANGE_OPERAND_SELECTION = 'CHANGE_OPERAND_SELECTION';

const SAVE_VARIABLE = 'SAVE_VARIABLE';
const POST_VARIABLE = 'POST_VARIABLE';
const RECIEVE_VARIABLE = 'RECIEVE_VARIABLE';

const CHANGE_INTERFACE_STATE = 'CHANGE_INTERFACE_STATE';

const EDIT_TABULAR_DATA = 'EDIT_TABULAR_DATA';
const EDIT_RASTER_DATA = 'EDIT_RASTER_DATA';
const EDIT_EXPRESSION_DATA = 'EDIT_EXPRESSION_DATA';

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

  if (range.includes("undefined"))
    return "Start and end date must be specified.";
  if (!range.match(/\d{4}-\d{3},\d{4}-\d{3}/g))
    return "Date must be entered in the form yyyy-ddd."

  return null;
}

function addInputVariable(variable){
  var node= variable.node;
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
      variable
    };
  } else {
    return {
      type: ADD_INPUT_VARIABLE,
      error: error,
      field: "rasterDataTemporalRange",
      id: nextVariableId++,
      variable
    };
  }
}

function editInputVariable(variable, idx){
  return {
    type: EDIT_INPUT_VARIABLE,
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

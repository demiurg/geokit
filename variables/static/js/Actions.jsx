'use strict';

const REQUEST_LAYERS = 'REQUEST_LAYERS';
const RECEIVE_LAYERS = 'RECEIVE_LAYERS';

const REQUEST_TABLES = 'REQUEST_TABLES';
const RECEIVE_TABLES = 'RECEIVE_TABLES';

const RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
const REQUEST_VARIABLES = 'REQUEST_VARIABLES';

const UPDATE_NAME = 'UPDATE_NAME';
const UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
const UPDATE_TREE = 'UPDATE_TREE';
const UPDATE_ERRORS = 'UPDATE_ERRORS';
const UPDATE_MODIFIED = 'UPDATE_MODIFIED';

const REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
const ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';

const ADD_TREE_NODE = 'ADD_TREE_NODE';

const SAVE_VARIABLE = 'SAVE_VARIABLE';
const POST_VARIABLE = 'POST_VARIABLE';
const RECIEVE_VARIABLE = 'RECIEVE_VARIABLE';

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

function fetchLayers(){
  return function(dispatch){
    dispatch(requestLayers());

    return $.ajax({
      url: '/api/layers',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveLayers(data));
      },
      error: function(xhr, status, err) {
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
      url: '/api/tables',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(receiveTables(data));
      },
      error: function(xhr, status, err) {
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
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

let nextVariableId = 0;

function addInputVariable(variable){
  return {
    type: ADD_INPUT_VARIABLE,
    id: nextVariableId++,
    variable
  };
}

function addTreeNode(node){
  return {
    type: ADD_TREE_NODE,
    node: node
  };
}

function updateName(name){
  var error = null;
  if (!name || !name.match(/^[a-zA-Z0-9]+$/)){
    error = "Name is not alphanumeric or contains spaces.";
  }
  return {
    type: UPDATE_NAME,
    name: name,
    error: error
  };
}

function updateDescription(description){
  return {
    type: UPDATE_DESCRIPTION,
    description: description
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
    modified: time
  };
}

function saveVariable(variable, created){
  return function(dispatch){
    dispatch(postVariable());

    return $.ajax({
      url: '/api/variables/' + (created ? variable.name + '/' : ''),
      dataType: 'json',
      cache: 'false',
      data: JSON.stringify(variable),
      method: created ? 'PATCH' : 'POST',
      contentType: "application/json",
      processData: false,
      success: function(data) {
        dispatch(updateModified(data.modified));
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

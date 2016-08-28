'use strict';

const REQUEST_LAYERS = 'REQUEST_LAYERS';
const RECEIVE_LAYERS = 'RECEIVE_LAYERS';

const REQUEST_TABLES = 'REQUEST_TABLES';
const RECEIVE_TABLES = 'RECEIVE_TABLES';

const RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
const REQUEST_VARIABLES = 'REQUEST_VARIABLES';

const UPDATE_METADATA = 'UPDATE_METADATA';
const UPDATE_TREE = 'UPDATE_TREE';

const REMOVE_INPUT_VARIABLE = 'REMOVE_INPUT_VARIABLE';
const ADD_INPUT_VARIABLE = 'ADD_INPUT_VARIABLE';

const ADD_TREE_NODE = 'ADD_TREE_NODE';

const SAVE_VARIABLE = 'SAVE_VARIABLE';
const POST_VARIABLE = 'POST_VARIABLE';
const GET_VARIABLE = 'GET_VARIABLE';


function requestLayers() {
  return {
    type: REQUEST_LAYERS
  }
}


function receiveLayers(json){
  return {
    type: RECEIVE_LAYERS,
    layers: json,
    receivedAt: Date.now()
  }
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
  }
}

function receiveTables(json){
  return {
    type: RECEIVE_TABLES,
    tables: json,
    receivedAt: Date.now()
  }
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
  }
}

function receiveVariables(json){
  return {
    type: RECEIVE_VARIABLES,
    variables: json,
    receivedAt: Date.now()
  }
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
  }
}

function addTreeNode(node){
  return {
    type: ADD_TREE_NODE,
    node: node
  }
}

function updateMetadata(metadata){
  return {
    type: UPDATE_METADATA,
    name: metadata.title,
    description: metadata.description
  }
}

function postVariables(json) {
  return {
    type: POST_VARIABLE,
    variable: json
  }
}

function getVariable(json){
  return {
    type: GET_VARIABLE,
    variable: json,
    receivedAt: Date.now()
  }
}

function saveVariable(json){
  return function(dispatch){
    dispatch(postVariable(json));

    return $.ajax({
      url: '/api/variables',
      dataType: 'json',
      cache: 'false',
      success: function(data) {
        dispatch(getVariable(data));
      },
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }
    });
  };
}

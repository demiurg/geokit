'use strict';

var REQUEST_LAYERS = 'REQUEST_LAYERS';
var RECEIVE_LAYERS = 'RECEIVE_LAYERS';

var REQUEST_TABLES = 'REQUEST_TABLES';
var RECEIVE_TABLES = 'RECEIVE_TABLES';

var RECEIVE_VARIABLES = 'RECEIVE_VARIABLES';
var REQUEST_VARIABLES = 'REQUEST_VARIABLES';

var UPDATE_METADATA = 'UPDATE_METADATA';
var UPDATE_TREE = 'UPDATE_TREE';


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

function layers(state={
  name: 'Layers',
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
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

function tables(state={
  name: 'Tables',
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
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


function variables(state={
  name: 'Variables',
  isFetching: false,
  didInvalidate: false,
  items: []
}, action){
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



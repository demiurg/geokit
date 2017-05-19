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

function rasterCatalog(state={
  items: [],
}, action){
  switch (action.type){
    case RECEIVE_RASTER_CATALOG:
      return Object.assign({}, state, {
        items: action.raster_catalog,
        lastUpdate: action.receivedAt
      });
    default:
      return state;
  }
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


function input_variables(state=[], action){
  switch (action.type) {
    case ADD_INPUT_VARIABLE:
      return [
        ...state,
        action.variable
      ];
    case REMOVE_INPUT_VARIABLE:
      return state.slice(
        0, action.index
      ).concat(
        state.slice(action.index+1)
      );
    case UPDATE_INPUT_VARIABLE:
      state.splice(action.index, 1, action.variable);
      return state;
    default:
      return state;
  }
}

let nextNodeId = 1;
let EMPTY = 'EMPTY';

function separateOperands(operands, tree) {
  return operands.map((operand) => {
    var id = nextNodeId;
    nextNodeId++;
    if (operand == EMPTY || operand.constructor != Array || operand.length != 2) {
      tree[id] = ['const', operand];
    } else {
      tree[id] = [operand[0], separateOperands(operand[1], tree)];
    }
    return id;
  });
}

function tree(state={}, action){
  switch (action.type){
    case INIT_TREE:
      {
        var tree= {
          0: [action.node[0], []]
        };
        tree[0][1] = separateOperands(action.node[1], tree);

        return tree;
      }
    case EDIT_TREE_NODE:
      {
        var new_tree = Object.assign({}, state);
        if (action.node.constructor != Array || action.node.length != 2) {
          new_tree[action.id] = ['const', action.node];
        } else {
          new_tree[action.id] = [action.node[0], separateOperands(action.node[1], new_tree)];
        }
        return new_tree;
      }
    default:
      return state;
  }
}

function operandSelections(state={}, action) {
  switch (action.type) {
    case CHANGE_OPERAND_SELECTION:
      return Object.assign({}, state, {
        [action.id]: action.value
      });
    default:
      return state;
  }
}

// Interface states
const DEFAULT = 'DEFAULT';
const ADDING_DATA_SOURCE = 'ADDING_DATA_SOURCE';
const EDITING_TABULAR_DATA = 'EDITING_TABULAR_DATA';
const EDITING_RASTER_DATA = 'EDITING_RASTER_DATA';
const EDITING_EXPRESSION = 'EDITING_EXPRESSION';

function node_editor(state={'mode': DEFAULT}, action){
  switch(action.mode){
    case ADDING_DATA_SOURCE:
      return Object.assign({}, state, {
        mode: action.mode,
      });
    case EDITING_RASTER_DATA:
      return Object.assign({}, state, {
        mode: action.mode,
        raster_data: action.data ? action.data : {
          name: "",
          raster: false,
          product: false,
          date_start: "",
          data_end: "",
          editing: false,
          index: -1,
          default_name: null,
          valid: false,
          errors: {}
        }
      });
    case EDITING_TABULAR_DATA:
      return Object.assign({}, state, {
        mode: action.mode,
        tabular_data: action.data ? action.data : {
          name: "",
          source1: "",
          source2: "",
          isEditing: false,
          index: -1
        }
      });
    case EDITING_EXPRESSION:
      return Object.assign({}, state, {
        mode: action.mode,
        expression_data: action.data ? action.data : {
          name: "",
          node: null,
          operand_refs: []
        }
      });
    case DEFAULT:
      return Object.assign({}, state, {
        mode: action.mode,
      });
    default:
      return state;
  }
}

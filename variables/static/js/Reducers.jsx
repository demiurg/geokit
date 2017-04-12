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

function input_variable(state, action){
  switch (action.type){
    case 'ADD_INPUT_VARIABLE':
      return {
        id: action.id,
        variable: action.variable
      }
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
        //input_variable(undefined, action)
      ];
    case REMOVE_INPUT_VARIABLE:
      return state.slice(
        0, action.index
      ).concat(
        state.slice(action.index+1)
      );
    case EDIT_INPUT_VARIABLE:
      state.splice(action.index, 1, action.variable);
      return state;
    default:
      return state;
  }
}

let nextNodeId = 1;

function separateOperands(operands, tree) {
  return operands.map((operand) => {
    var id = nextNodeId;
    nextNodeId++;
    if (operand.constructor != Array || operand.length != 2) {
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
  }
}

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
    default:
      return state;
  }
}

function tree(state={}, action){
  switch (action.type){
    case ADD_TREE_NODE:
      return action.node;
    default:
      return state;
  }
}
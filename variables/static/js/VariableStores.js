var _LayerState = {
  variables: [],
  message: ""
};

var _LoadLayers = function() {
  $.ajax({
    url: '/api/layers',
    dataType: 'json',
    cache: 'false',
    success: function(data) {
      _LayerState.variables = data;
      LayerStore.emitChange();
    },
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
      _LayerState.message = err.toString();
      LayerStore.emitChange();
    }
  });
};

var loadLayers = _LoadLayers;


var _TableState = {
  variables: [],
  message: ""
};

var _LoadTables = function() {
  $.ajax({
    url: '/api/tables',
    dataType: 'json',
    cache: 'false',
    success: function(data) {
      _TableState.variables = data;
      TableStore.emitChange();
    },
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
      _TableState.message = err.toString();
      TableStore.emitChange();
    }
  });
};

var loadLayers = _LoadLayers;


var _formVariableState = {
  variables: [],
  message: ""
};

var _loadFormVariables = function() {
  $.ajax({
    url: '/api/form_variables',
    dataType: 'json',
    cache: 'false',
    success: function(data) {
      _formVariableState.variables = data;
      FormVariableStore.emitChange();
    },
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
      _formVariableState.message = err.toString();
      FormVariableStore.emitChange();
    }
  });
};

var loadFormVariables = _loadFormVariables;

var FormVariableStore = $.extend({}, EventEmitter.prototype, {
  getState: function() {
    return _formVariableState;
  },
  emitChange: function() {
    this.emit('change');
  },
  addChangeListener: function(callback) {
    this.on('change', callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener('change', callback);
  }
});

var _userVariableState = {
  variables: [],
  message: ""
};

var _loadUserVariables = function() {
  $.ajax({
    url: '/api/expressions',
    dataType: 'json',
    cache: 'false',
    success: function(data) {
      _userVariableState.variables = data,
      UserVariableStore.emitChange();
    },
    error: function(xhr, status, err) {
      console.error(this.props.url, status, err.toString());
      _userVariableState.message = err.toString();
      UserVariableStore.emitChange();
    }
  });
};

var loadUserVariables = _loadUserVariables;

var UserVariableStore = $.extend({}, EventEmitter.prototype, {
  getState: function() {
    return _userVariableState;
  },
  emitChange: function() {
    this.emit('change');
  },
  addChangeListener: function(callback) {
    this.on('change', callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener('change', callback);
  }
});

AppDispatcher.register(function(action) {
});

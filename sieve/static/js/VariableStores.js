var _formVariableState = {
  variables: [],
  message: ''
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
      _state.message = err.toString();
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

AppDispatcher.register(function(action) {
});

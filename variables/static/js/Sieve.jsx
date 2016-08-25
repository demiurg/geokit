const {
  Table, Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Input, OverlayTrigger, Tooltip, Tabs, Tab, DropdownButton, MenuItem,
  Modal, FieldGroup, FormControl, ControlLabel, FormGroup
} = ReactBootstrap;

/* app */

var initialState = Object.assign({
  title: "",
  description: "",
  spatialDomain: null,
  temporalDomain: {start: null, end: null},
  errors: {},
  tree: {},
  input_variables: []
}, sieve_props.initialData);


function sieveApp(state=initialState, action){
  switch (action.type){
    case REQUEST_LAYERS:
    case RECEIVE_LAYERS:
      return Object.assign({}, state, {
        layers: layers(state[action.layers], action)
      });
    case REQUEST_TABLES:
    case RECEIVE_TABLES:
      return Object.assign({}, state, {
        tables: tables(state[action.tables], action)
      });
    case REQUEST_VARIABLES:
    case RECEIVE_VARIABLES:
      return Object.assign({}, state, {
        variables: variables(state[action.variables], action)
      });
    case UPDATE_METADATA:
      return Object.assign({}, state, {
        title: action.metadata.title,
        description: action.metadata.description
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        tree: action.tree
      });
    case ADD_TREE_NODE:
      return Object.assign({}, state, {
        tree: tree(state.tree, action)
      });
    case ADD_VARIABLE:
      return Object.assign({}, state, {
        input_variables: input_variables(state.input_variables, action)
      });
    default:
      return state;
  }
}


var mapStateToProps = (state) => {
  return Object.assign({}, state, {
    metadata: {title: state.title, description: state.description}
  });
};

var mapDispatchToProps = (dispatch) => {
  return {
    onMetadataChange: (metadata) => {
      dispatch(updateMetadata(metadata));
    },
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onAddTreeOp: (op) => {
      dispatch(addTreeNode(op));
    }
  };
};

/* components */
var DropdownComponent = ({things, onclick}) => (
  // TODO something different when layers.isFetching

  <DropdownButton title={things.name} id="form-var-dropdown">
    {things.items.map((item, i) => item.field_names ?
      item.field_names.map((field, j) =>
        <MenuItem
          key={`${j}${i}`}
          eventKey={`${j}${i}`}
          onClick={() => onclick(things.tovar(item.name, field))}
          >
            {`${field}/${item.name}`}
        </MenuItem>
      ) : null
    )}
  </DropdownButton>
)


DropdownComponent.propTypes = {
  onclick: React.PropTypes.func.isRequired,
  things: React.PropTypes.shape({
    name: React.PropTypes.string.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired
};

class VariableButtonGroup extends React.Component {
  /*static propTypes = {
    onclick: React.PropTypes.func.isRequired;
    variables: React.PropTypes.arrayOf(React.PropTypes.shape({
    name: React.PropTypes.number.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired).isRequired*/

  render(){
    var join = null;
    return (
      <ButtonGroup>
      {
        this.props.variables.map((things, i) =>
          <DropdownComponent
            things={things}
            onclick={(token) => {this.props.dispatch(insertToken(token))}}
            key={i}
          />
        )
      }
      </ButtonGroup>
    );
  }
}


var i2o = (type, item, i) => { return (item, i) => {
  if (item.field_names){
    return item.field_names.map((field, j) => (
      <option value={
        `{"type": "${type}", "id": "${item.name}", "field": "${field}"}`
      }>
        {`${item.name}/${field}`}
      </option>
    ))
  }
}};


class AddDataInputModal extends React.Component {
  constructor(props){
    super(props);
    this.state = { showModal: false, variable: null};
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  use() {
    var form = $(this.form).serializeArray();
    var variable = {
      name: form[2]['value'],
      node: [
        'join',
        [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]
      ]
    };
    this.props.onAddInputVariable(variable);
    this.setState({ showModal: false });
  }

  render(){
    var validate = (e) => {
      var form = $(this.form).serializeArray();
      this.setState({
        variable: form[0]['value'] && form[1]['value'] && form[2]['value'])
      });
    }
    return (
      <Button
        bsStyle="primary"
        onClick={this.open.bind(this)}
      >
        {this.props.children ? this.props.children : "Add Input"}
        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form ref={(ref)=>{this.form=ref}} onChange={validate}>
              <FormGroup controlId="leftSelect">
                <ControlLabel>Left</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="left">
                  {
                    this.props.layers.items.map(
                      i2o('Layer')
                    ).concat(
                      this.props.tables.items.map(i2o('Table'))
                    )
                  }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="rightSelect">
                <ControlLabel>Right</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="right">
                  {
                    this.props.layers.items.map(
                      i2o('Layer')
                    ).concat(
                      this.props.tables.items.map(i2o('Table'))
                    )
                  }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl name="name" type="text"/>
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
           { this.state.variable ?
              <Button onClick={this.use.bind(this)}>Use Variable</Button> :
              null }
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}


class AddExpressionInputModal extends React.Component {
  constructor(props){
    super(props);
    this.state = { showModal: false};
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  use() {
    var form = $(this.form).serializeArray();
    var variable = [
      'expression',
      [JSON.parse(form[0]['value'])]
    ];
    this.props.onAddInputVariable(variable);
    this.setState({ showModal: false });
  }

  render(){
    return (
      <Button
        bsStyle="primary"
        onClick={this.open.bind(this)}
      >
        {this.props.children ? this.props.children : "Add Input"}

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form ref={(ref)=>{this.form=ref}}>
              <FormGroup controlId="numericText">
                <ControlLabel>Expression</ControlLabel>
                <FormControl componentClass="textarea" placeholder="type number, like '1'" name="numericText">
                </FormControl>
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Use Variable</Button>
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}


class AddBinOpModal extends React.Component {
  constructor(props){
    super(props);
    this.state = { showModal: false };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  use() {
    var form = $(this.form).serializeArray();
    var variable = [
      this.props.op,
      [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]
    ];
    this.props.onAddTreeOp(variable);
    this.setState({ showModal: false });
  }

  render(){
    return (
      <Button
        bsStyle="primary"
        onClick={this.open.bind(this)}
      >
        {this.props.children ? this.props.children : this.props.op}
        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Binary Operation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form ref={(ref)=>{this.form=ref}}>
              <FormGroup controlId="leftSelect">
                <ControlLabel>Left operand</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="left">
                  { this.props.input_variables.map((v, i) => (
                    <option key={i} value={JSON.stringify(v.node)}>
                      {v.name ? v.name : rendertree(v)}
                    </option>
                  )) }
                  <option
                    key={this.props.input_variables.length}
                    value={JSON.stringify(this.props.tree)}>
                    tree
                  </option>
                </FormControl>
              </FormGroup>
              <FormGroup controlId="rightSelect">
                <ControlLabel>Right operand</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="right">
                  <option
                    key={this.props.input_variables.length}
                    value={JSON.stringify(this.props.tree)}>
                    tree
                  </option>
                  { this.props.input_variables.map((v, i) => (
                    <option key={i} value={JSON.stringify(v.node)}>
                      {v.name ? v.name : rendertree(v)}
                    </option>)) }
                </FormControl>
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Use Operation</Button>
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}

class AddSelectModal extends React.Component {
  constructor(props){
    super(props);
    this.state = { showModal: false, variable: null};
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onselect = (form) => {
    var form = $(form).serializeArray();
    var variable = [
      this.props.op,
      [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]
    ];
    this.setState({ variable: variable});
  };

  use() {
    if (this.state.variable){
      this.props.onAddTreeOp(this.state.variable);
      this.setState({ showModal: false });
    }else{
      alert('Select a variable to use.');
    }
  }

  render(){
    return (
      <Button
        bsStyle="primary"
        onClick={this.open.bind(this)}
      >
        {this.props.children ? this.props.children : this.props.op}
        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Select Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <SelectForm onselect={this.onselect} {...this.props} />
          </Modal.Body>
          <Modal.Footer>
           { this.state.variable ?
             <Button onClick={this.use.bind(this)}>Use Variable</Button> :
             null }
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}

class SelectForm extends React.Component {
  render(){
    var onChange = (e) => {
      this.props.onselect(this.form);
    };
    var property = (
        <FormGroup controlId="rightSelect">
          <ControlLabel>Variable Property</ControlLabel>
          <FormControl
            componentClass="select"
            placeholder="select"
            name="right"
            onChange={onChange}>
            <option key={9999} value={null} >Not Selected</option>
            {
              this.props.layers.items.map(
                i2o('Layer')
              ).concat(
                this.props.tables.items.map(i2o('Table'))
              )
            }
          </FormControl>
        </FormGroup>
      );
    return (
      <form ref={(ref)=>{this.form=ref}}>
        <FormGroup controlId="leftSelect">
          <ControlLabel>Input Variable</ControlLabel>
          <FormControl componentClass="select" placeholder="select" name="left">
            {this.props.input_variables.map((v, i) => (
              <option key={i} value={JSON.stringify(v.node)}>
                {v.name ? v.name : rendertree(v)}
              </option>
            ))}
          </FormControl>
        </FormGroup>
        {property}
      </form>
    );
  }
}

class SieveComponent extends React.Component {
  constructor(props){
    super(props);
  }

  validateVariable() {
    var errors = {},
        isValid = true,
        data = {
          name: this.props.metadata.title,
          description: this.props.metadata.description,
          tree: this.props.tree
        };

    if (!data.name || data.name === '') {
      isValid = false;
      errors.name = "You must provide a title.";
    }

    if (!data.tree || data.tree === '') {
      isValid = false;
      errors.tree = "You must specify variable text."
    }

    return {isValid: isValid, errors: errors, data: data};
  }

  saveVariable(e) {
    e.stopPropagation();
    var validationResponse = this.validateVariable();

    if (validationResponse.isValid) {
      var xhr = new XMLHttpRequest();

      if (this.props.initialData) {
        xhr.open("PUT", "/api/variables/"+this.props.initialData.id+"/", true);
      } else {
        xhr.open("POST", "/api/variables/", true);
      }

      xhr.setRequestHeader("Content-type", "application/json");
      xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));

      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          if (200 <= xhr.status && xhr.status < 300) {
            window.location.href = window.redirect_after_save;
          } else {
            this.setState({errors: {server: xhr.response}});
          }
        }
      };

      xhr.send(JSON.stringify(validationResponse.data));
    } else {
      console.log(validationResponse.errors);
      this.setState({errors: validationResponse.errors});
    }
  }

  render() {
    var self = this;

    return (
      <div className="sieve">
        {this.props.errors.server ? <Alert bsStyle="danger">{this.props.errors.server}</Alert> : null}
        <Panel>
          <MetaData
            ref='metadata'
            updateMetadata={this.props.onMetadataChange.bind(this)}
            title={this.props.metadata.title} description={this.props.metadata.description} />
        </Panel>

        <Panel header={<h3>Input Variables</h3>}>
          {this.props.input_variables.length ?
            <dl className="dl-horizontal">{
            this.props.input_variables.map((variable)=>{
              return [
                <dt>{variable.name}</dt>,
                <dd>{rendertree(variable.node)}</dd>
              ];
            })
            }</dl>
            : "Add some!"
          }
          <div className='pull-right'>
            <ButtonToolbar>
              <ButtonGroup>
                <AddDataInputModal {...this.props} >Add Data Input</AddDataInputModal>
                <AddExpressionInputModal {...this.props} >Add Expression Input</AddExpressionInputModal>
              </ButtonGroup>
            </ButtonToolbar>
          </div>
        </Panel>

        <Panel>
          <div className='pull-right'>
            <ButtonToolbar>
              <ButtonGroup>
                <AddSelectModal op='select' {...this.props}>Select</AddSelectModal>
                <AddBinOpModal op='*' {...this.props}>x</AddBinOpModal>
                <AddBinOpModal op='/' {...this.props}>/</AddBinOpModal>
                <AddBinOpModal op='+' {...this.props}>+</AddBinOpModal>
                <AddBinOpModal op='-' {...this.props}>-</AddBinOpModal>
              </ButtonGroup>
            </ButtonToolbar>
          </div>
          <p>
            {rendertree(this.props.tree)}
          </p>

        </Panel>

        <ButtonInput bsSize="large" onClick={this.saveVariable.bind(this)}>Save</ButtonInput>
      </div>
    );
  }
}


var rendertree = (tree) => {
    console.log('render: ', tree);
    if (tree.length && tree.length == 2){
      var op = tree[0];
      var left = tree[1][0];
      var right = tree[1][1];

      switch (op) {
        case 'select':
          return "Select " + right.id + "/" + right.field + " from (" + rendertree(left) + ")";
        case 'expression':
          return left;
        case 'join':
          console.log(left, right);
          let str = "Join " +
            left.type + ' ' + left.id + ' and ' +
            right.type + ' ' + right.id + ' on ' +
            left.field + ' = ' + right.field
          ;
          return str;
        default:
          return rendertree(left) + " " + op + " " + rendertree(right);
      }
    } else {
      return JSON.stringify(tree);
    }
};


class TreeView extends React.Component {
  render(){
    return <span>{rendertree(this.props.children)}</span>;
  }
}

var Sieve = ReactRedux.connect(
  mapStateToProps,
  mapDispatchToProps
)(SieveComponent);


function sieve(el){
  var store = Redux.createStore(
    sieveApp,
    Redux.applyMiddleware(ReduxThunk.default)
  );

  store.dispatch(fetchLayers());
  store.dispatch(fetchTables());
  store.dispatch(fetchVariables());

  ReactDOM.render(
    React.createElement(
      ReactRedux.Provider,
      {
        children: React.createElement(Sieve, sieve_props),
        store: store
      }
    ),
    el
  );
}

// Since this script is pulled in as 'text/babel', other scripts will go ahead and run
// even if this one isn't finished. This provides a reliable way to know when it has
// finished and to access its exports.
var sieve_defined = new CustomEvent(
  'sievedefined',
  {
    detail: { sieve }
  }
);
document.dispatchEvent(sieve_defined);

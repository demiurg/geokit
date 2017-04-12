const {
  Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Tabs, DropdownButton, MenuItem, Table,
  Modal, FormControl, ControlLabel, FormGroup, HelpBlock
} = ReactBootstrap;

/* app */

var initialState = Object.assign({
  errors: {"name": null, "tree": null},
  name: "",
  tree: {},
  description: "",
  spatialDomain: null,
  temporalDomain: {start: null, end: null},
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  editingTabularData: {},
  editingRasterData: {}
}, window.sieve_props);


function sieveApp(state=initialState, action){
  switch (action.type){
    case REQUEST_LAYERS:
    case RECEIVE_LAYERS:
      return Object.assign({}, state, {
        layers: layers(state.layers, action)
      });
    case REQUEST_TABLES:
    case RECEIVE_TABLES:
      return Object.assign({}, state, {
        tables: tables(state.tables, action)
      });
    case REQUEST_VARIABLES:
    case RECEIVE_VARIABLES:
      return Object.assign({}, state, {
        variables: variables(state.variables, action)
      });
    case RECEIVE_RASTER_CATALOG:
      return Object.assign({}, state, {
        raster_catalog: rasterCatalog(state.raster_catalog, action)
      });
    case UPDATE_NAME:
      return Object.assign({}, state, {
        changed: true,
        name: action.name,
        errors: Object.assign({}, state.errors, {name: action.error})
      });
    case UPDATE_DESCRIPTION:
      return Object.assign({}, state, {
        changed: true,
        description: action.description
      });
    case UPDATE_SPATIAL_DOMAIN:
      return Object.assign({}, state, {
        spatialDomain: action.layer_id
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        changed: true,
        tree: action.tree,
        errors: Object.assign({}, state.errors, {tree: action.error})
      });
    case UPDATE_ERRORS:
      return Object.assign({}, state, {
        errors: action.errors
      });
    case INIT_TREE:
    case EDIT_TREE_NODE:
      return Object.assign({}, state, {
        changed: true,
        tree: tree(state.tree, action)
      });
    case ADD_INPUT_VARIABLE:
    case REMOVE_INPUT_VARIABLE:
      return Object.assign({}, state, {
        changed: true,
        input_variables: input_variables(state.input_variables, action)
      });
    case UPDATE_MODIFIED:
      return Object.assign({}, state, {
        modified: action.time
      });
    case UPDATE_CREATED:
      return Object.assign({}, state, {
        created: action.time
      });
    case EDIT_RASTER_DATA:
      return Object.assign({}, state, {
        editingRasterData: action.data
      });
    case EDIT_TABULAR_DATA:
      return Object.assign({}, state, {
        editingTabularData: action.data
      });
    default:
      return state;
  }
}

var mapStateToProps = (state) => {
  return Object.assign({}, state);
};

var mapDispatchToProps = (dispatch) => {
  return {
    onSaveVariable: (v, c) => {
      dispatch(saveVariable(v, c));
    },
    onNameChange: (e) => {
      dispatch(updateName(e.target.value));
    },
    onDescriptionChange: (e) => {
      dispatch(updateDescription(e.target.value));
    },
    onSpatialDomainChange: (e) => {
      if (e == null)
        dispatch(updateSpatialDomain(null));
      else
        dispatch(updateSpatialDomain(e.value));
    },
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: (i) => {
      dispatch(removeInputVariable(i));
    },
    onInitTree: (node) => {
      dispatch(initTree(node));
    },
    onEditTreeNode: (id, node) => {
      dispatch(editTreeNode(id, node));
    },
    onEditRasterData: (data) => {
      dispatch(editRasterData(data));
    },
    onEditTabularData: (data) => {
      dispatch(editTabularData(data));
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

//  layer or table item to bare dict option
var i2o = (type, item, i) => { return (item, i) => {
  if (item.field_names){
    return item.field_names.map((field, j) => (
      <option value={
        `{"type": "${type}", "name": "${item.name}", "id": ${item.id}, "field": "${field}"}`
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

  validate = (e) => {
    var form = $(this.form).serializeArray();
    if (form[0]['value'] && form[1]['value'] && form[2]['value']){
      var variable = {
        name: form[2]['value'],
        node: [
          'join',
          [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]
        ]
      };
      this.setState({
        variable: variable
      });
    }
  };

  use() {
    this.props.onAddInputVariable(this.state.variable);
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
            <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
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
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
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


class AddRasterInputModal extends React.Component {
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

  validate = (e) => {
    var form = $(this.form).serializeArray();
    if (form[0]['value'] && form[1]['value'] && form[2]['value'] && form[3]['value']){
      var variable = {
        name: form[3]['value'],
        node: [
          'raster',
          [
            JSON.parse(form[0]['value']),
            JSON.parse(form[1]['value']),
            form[2]['value']
          ]
        ]
      };
      this.setState({
        variable: variable
      });
    }
  };

  use() {
    this.props.onAddInputVariable(this.state.variable);
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
            <Modal.Title>Adding Raster Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
              <FormGroup controlId="rightSelect">
                <ControlLabel>Raster</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="right">
                  {
                    this.props.raster_catalog.items.map((r, i) => (
                      <option key={i} value={
                        `{"name": "${r.description}", "id": "${r.name}"}`
                      }>
                        {r.description + ': ' + r.band}
                      </option>
                    ))
                  }
                </FormControl>
              </FormGroup>
              <FormGroup controlId="leftSelect">
                <ControlLabel>Spatial&nbsp;Layer</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="left">
                {this.props.layers.items.map((v, i) => (
                  <option key={i} value={
                    `["source", [{"type": "Layer", "name": "${v.name}", "id": "${v.id}", "field": "shaid"}]]`
                  }>
                    {v.name ? v.name : rendertree(v)}
                  </option>
                ))}
                </FormControl>
              </FormGroup>
              <FormGroup controlId="name">
                <ControlLabel>Temporal&nbsp;Range</ControlLabel>
                <FormControl
                  name="dates" type="text" placeholder="enter like 2000-001,2000-31"
                />
              </FormGroup>
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
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
    var variable = {
      node: [
        'expression',
        [JSON.parse(form[1]['value'])]
      ],
      name: form[0]['value']
    };
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
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
              </FormGroup>
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


class AddSelectInputModal extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showModal: false,
      select_node: null
    };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onSelectNode = (select_node) => {
    this.setState({ select_node: select_node});
  };

  use() {
    if (this.state.select_node){
      var form = $(this.form).serializeArray();
      var variable = {
        node: this.state.select_node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
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
        {this.props.children ? this.props.children : "Add Input"}

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <SelectForm onSelectNode={this.onSelectNode} {...this.props} />
            <form ref={(ref)=>{this.form=ref}}>
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
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


class AddLayerInputModal extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showModal: false,
      node: null
    };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onSelectNode = (node) => {
    this.setState({node: node});
  };

  use() {
    if (this.state.node){
      this.props.onAddTreeOp(this.state.node);
      this.setState({ showModal: false });
    }else{
      alert('Select a variable to use.');
    }
  }

  use() {
    if (this.state.node){
      var form = $(this.form).serializeArray();
      console.log(this.state.node);
      var variable = {
        node: this.state.node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
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
        {this.props.children ? this.props.children : "Add Input"}

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Layer Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <SelectLayerForm onSelectNode={this.onSelectNode} {...this.props} />
            <form ref={(ref)=>{this.form=ref}}>
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Add</Button>
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}

class AddTableInputModal extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showModal: false,
      node: null
    };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onSelectNode = (node) => {
    this.setState({node: node});
  };

  use() {
    if (this.state.node){
      var form = $(this.form).serializeArray();
      var variable = {
        node: this.state.node,
        name: form[0]['value']
      };
      this.props.onAddInputVariable(variable);
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
        {this.props.children ? this.props.children : "Add Input"}

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Adding Table Input Variable</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <SelectTableForm onSelectNode={this.onSelectNode} {...this.props} />
            <form ref={(ref)=>{this.form=ref}}>
              <FormGroup controlId="name">
                <ControlLabel>Name</ControlLabel>
                <FormControl
                  name="name" type="text" placeholder="enter variable name"
                />
              </FormGroup>
            </form>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Add</Button>
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
                    Current tree
                  </option>
                </FormControl>
              </FormGroup>
              <FormGroup controlId="rightSelect">
                <ControlLabel>Right operand</ControlLabel>
                <FormControl componentClass="select" placeholder="select" name="right">
                  <option
                    key={this.props.input_variables.length}
                    value={JSON.stringify(this.props.tree)}>
                    Current tree
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


class AddUnaryOpModal extends React.Component {
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
      [JSON.parse(form[0]['value'])]
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
                      {v.name ? v.name : treeToNode(v).html(0)}
                    </option>
                  )) }
                  <option
                    key={this.props.input_variables.length}
                    value={JSON.stringify(this.props.tree)}>
                    tree
                  </option>
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
    this.state = {
      showModal: false,
      select_node: null
    };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onSelectNode = (select_node) => {
    this.setState({select_node: select_node});
  };

  use() {
    if (this.state.select_node){
      this.props.onAddTreeOp(this.state.select_node);
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
            <SelectForm onSelectNode={this.onSelectNode} {...this.props} />
          </Modal.Body>
          <Modal.Footer>
           { this.state.select_node ?
             <Button onClick={this.use.bind(this)}>Use Variable</Button> :
             null }
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Button>
    );
  }
}


class AddMeanModal extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showModal: false,
      node: null
    };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  onSelectNode = (node) => {
    this.setState({node: node});
  };

  use() {
    if (this.state.node){
      var form = $(this.form).serializeArray();
      var right = JSON.parse(form[0]['value']);

      var mean_node = [
        'mean', [this.state.node, right]
      ];
      this.props.onAddTreeOp(mean_node);
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
            <Modal.Title>Mean Operation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form ref={(ref)=>{this.form=ref}}>
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
                      {v.name ? v.name : treeToNode(v).html(0)}
                    </option>)) }
                </FormControl>
              </FormGroup>
            </form>
            <SelectForm onSelectNode={this.onSelectNode} {...this.props} />
          </Modal.Body>
          <Modal.Footer>
           { this.state.node ?
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
  constructor(props){
    super(props);
    this.state = {
      variable: null,
      select_variable: null,
      select_property: null
    };
  }

  onVariableChange = (e) => {
    if (e.target.value){
      var v = JSON.parse(e.target.value);
      if( v[0] == 'select' ){
        this.props.onSelectNode(v);
        this.setState({variable: v});
      } else {
        this.setState({select_variable: v});
      }
    }
  };

  onPropertyChange = (e) => {
    //this.setState({select_property: JSON.parse(e.target.value)});
    if (e.target.value){
      var node = [
        'select',
        [this.state.select_variable, JSON.parse(e.target.value)]
      ];
      this.props.onSelectNode(node);
    }
  };

  render(){
    var property = null;
    if (this.state.select_variable){
      if (this.state.select_variable[0] == 'join') {
        let of_variable = (_type) => {
          return (item) => {
            return (
              (
                this.state.select_variable[1][0]['type'] == _type &&
                this.state.select_variable[1][0]['id'] == item['id']
              ) ||
              (
                this.state.select_variable[1][1]['type'] == _type &&
                this.state.select_variable[1][1]['id'] == item['id']
              )
            );
          }
        };
        var options = this.props.layers.items.filter(of_variable('Layer')).map(
          i2o('Layer')
        ).concat(
          this.props.tables.items.filter(of_variable('Table')).map(i2o('Table'))
        );
        property = (
          <FormGroup controlId="rightSelect">
            <ControlLabel>Variable&nbsp;Property</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="right"
              onChange={this.onPropertyChange.bind(this)}>
              <option key={9999} value={null} >Not Selected</option>
              {options}
            </FormControl>
          </FormGroup>
        );
      } else if (this.state.select_variable[0] == 'source') {
        let of_variable = (_type) => {
          return (item) => {
            return (
              this.state.select_variable[1][0]['type'] == _type &&
              this.state.select_variable[1][0]['id'] == item['id']
            );
          }
        };
        var options = this.props.layers.items.filter(of_variable('Layer')).map(
          i2o('Layer')
        ).concat(
          this.props.tables.items.filter(of_variable('Table')).map(
            i2o('Table')
          )
        );
        property = (
          <FormGroup controlId="rightSelect">
            <ControlLabel>Variable&nbsp;Property</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="right"
              onChange={this.onPropertyChange.bind(this)}>
              <option key={9999} value={null} >Not Selected</option>
              {options}
            </FormControl>
          </FormGroup>
        );
      } else if (this.state.select_variable[0] == 'raster') {
        var options = [
          ['mean', 'Mean'],
          ['maximum', 'Maximum'],
          ['minimum', 'Minimum'],
          ['skew', 'Skew'],
          ['sd', 'Standard Deviation']
        ].map((o, i) => (
          <option key={i} value={
            '{"name": "raster", "field": "' + o[0] + '"}'
          }>{o[1]}</option>
        ));
        property = (
          <FormGroup controlId="rightSelect">
            <ControlLabel>Variable&nbsp;Property</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="right"
              onChange={this.onPropertyChange.bind(this)}>
              <option key={9999} value={null} >Not Selected</option>
              {options}
            </FormControl>
          </FormGroup>
        );
      }
    }

    return (
      <form ref={(ref)=>{this.form=ref}}>
        <FormGroup controlId="leftSelect">
          <ControlLabel>Input&nbsp;Variable</ControlLabel>
          <FormControl
            componentClass="select"
            placeholder="select"
            name="left"
            onChange={this.onVariableChange.bind(this)}>
            <option key={9999} value={null} >Not Selected</option>
            {this.props.input_variables.map((v, i) => (
              <option key={i} value={JSON.stringify(v.node)}>
                {v.name ? v.name : treeToNode(v).html(0)}
              </option>
            ))}
          </FormControl>
        </FormGroup>
        {property}
      </form>
    );
  }
}


class SelectLayerForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      variable: null,
    };
  }

  onVariableChange = (e) => {
    if (e.target.value){
      var v = JSON.parse(e.target.value);
      this.props.onSelectNode(v);
    }
  };

  render(){
    var property = null;
    return (
      <form ref={(ref)=>{this.form=ref}}>
        <FormGroup controlId="leftSelect">
          <ControlLabel>Spatial&nbsp;Layer</ControlLabel>
          <FormControl
            componentClass="select"
            placeholder="select"
            name="left"
            onChange={this.onVariableChange.bind(this)}>
            <option key={9999} value={null} >Not Selected</option>
            {this.props.layers.items.map((v, i) => (
              <option key={i} value={
                `["source", [{"type": "Layer", "name": "${v.name}", "id": ${v.id}, "field": "shaid"}]]`
              }>
                {v.name ? v.name : treeToNode(v).html(0)}
              </option>
            ))}
          </FormControl>
        </FormGroup>
        {property}
      </form>
    );
  }
}


class SelectTableForm extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      variable: null,
    };
  }

  onVariableChange = (e) => {
    if (e.target.value){
      var v = JSON.parse(e.target.value);
      this.props.onSelectNode(v);
    }
  };

  render(){
    var property = null;
    return (
      <form ref={(ref)=>{this.form=ref}}>
        <FormGroup controlId="leftSelect">
          <ControlLabel>Tabular&nbsp;Layer</ControlLabel>
          <FormControl
            componentClass="select"
            placeholder="select"
            name="left"
            onChange={this.onVariableChange.bind(this)}>
            <option key={9999} value={null} >Not Selected</option>
            {this.props.tables.items.map((v, i) => (
              <option key={i} value={
                `["source", [{"type": "Table", "name": "${v.name}", "id": ${v.id}}]]`
              }>
                {v.name ? v.name : treeToNode(v).html(0)}
              </option>
            ))}
          </FormControl>
        </FormGroup>
        {property}
      </form>
    );
  }
}

class SpatialConfiguration extends React.Component {
  componentDidMount() {
    var map = this.map = L.map('spatial-config-map').setView([0, 0], 2);

    this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'ags.n5m0p5ci',
        accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
    }).addTo(map);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.spatialDomain != this.props.spatialDomain) {
      if (this.geoJsonTileLayer)
        this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatialDomain) {
        var geoJsonURL = '/layers/' + this.props.spatialDomain + '/{z}/{x}/{y}.json';
        this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
          clipTiles: true,
          unique: function(feature) {
            return feature.properties.id;
          }
        }, {
          pointToLayer: function(feature, latlng) {
            return new L.CircleMarker(latlng, {
              radius: 4,
              fillColor: "#A3C990",
              color: "#000",
              weight: 1,
              opacity: 0.7,
              fillOpacity: 0.3
            });
          }
        });

        this.map.addLayer(this.geoJsonTileLayer);

        $.ajax('/api/layers/' + this.props.spatialDomain, {
          dataType: 'json',
          success: (data, status, xhr) => {
            var bounds = [
              [data['bounds'][1], data['bounds'][0]],
              [data['bounds'][3], data['bounds'][2]]
            ];
            this.map.fitBounds(bounds);
          }
        });
      }
    }
  }

  render() {
    var layer_options = this.props.layers.items.map((layer) => {
      return { value: layer.id, label: layer.name };
    });

    return (
      <Panel header="Spatial configuration">
        <Select value={this.props.spatialDomain} options={layer_options} onChange={this.props.onSpatialDomainChange} />
        <div id="spatial-config-map" style={{height: 400, marginTop: 10}}></div>
      </Panel>
    );
  }
}

class TabularDataSource extends React.Component {
  onSave() {
    // Call `this.props.onAddInputVariable(var) when Save button is clicked.
    //
    // var should be in the form:
    // {
    //   name: '',
    //   node: [
    //      'join', [<source (see below)>, <source>]
    //   ]
    // }
    //
    // <source> should be in the form:
    // {
    //   type: 'Layer' | 'Table',
    //   id: <Number>,
    //   name: '',
    //   field: ''
    // }

    var variable = {
      name: this.props.editingTabularData.name,
      node: [
        'join',
        [
          this.props.editingTabularData.source1,
          this.props.editingTabularData.source2
        ]
      ]
    };
    this.props.onEditTabularData({
      name: "",
      source1: "",
      source2: ""
    });
    this.props.onAddInputVariable(variable);
  }

  validate() {
    var form = $(this.form).serializeArray();
    var name = form[2]['value'];
    var source1 = form[0]['value'];
    var source2 = form[1]['value'];

    var data = {
      name: name,
      source1: source1,
      source2: source2
    };

    this.props.onEditTabularData(data);
    // if (form[0]['value'] && form[1]['value'] && form[2]['value']){
    //   var variable = {
    //     name: form[2]['value'],
    //     node: [
    //       'join',
    //       [JSON.parse(form[0]['value']), JSON.parse(form[1]['value'])]
    //     ]
    //   };
    //   this.setState({
    //     variable: variable
    //   });
    // }
  };

  render() {
    return (
      <Panel header="Tabular data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="formSelectSource">
            <ControlLabel>Source 1</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              value={this.props.editingTabularData.source1}
              name="table"
            >
              {
                this.props.tables.items.map(i2o('Table')
                ).concat(
                  this.props.layers.items.map(i2o('Layer'))
                )
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="formSelectDest">
            <ControlLabel>Source 2</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="layer"
              value={this.props.editingTabularData.source2}
            >
              {
                this.props.tables.items.map(i2o('Table')
                ).concat(
                  this.props.layers.items.map(i2o('Layer'))
                )
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text" placeholder="enter variable name"
              value={this.props.editingTabularData.name}
            />
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
        </form>
      </Panel>
    );
  }
}

class RasterDataSource extends React.Component {
  onSave() {
    // Call `this.props.onAddInputVariable(var) when Save button is clicked.
    //
    // var should be an object in the form:
    // {
    //   name: '',
    //   node: [
    //     'raster',
    //     [
    //       '<raster_layer>',
    //       '<spatial_layer>',
    //       '<temporal_range, e.g. '2010-001,2010-030'>'
    //     ]]
    // }
    //

    var variable = {
      name: this.props.editingRasterData.name,
      node: [
        'raster',
        [
          this.props.editingRasterData.raster,
          this.props.spatialDomain,
          this.props.editingRasterData.temporalRange
        ]
      ]
    };

    this.props.onEditRasterData({
      name: "",
      raster: "",
      temporalRange: ""
    });
    this.props.onAddInputVariable(variable);
  }

  validate() {

    var form = $(this.form).serializeArray();
    var name = form[2]['value'];
    var raster = form[0]['value'];
    var temporalRange = form[1]['value'];

    var data = {
      name: name,
      raster: raster,
      temporalRange: temporalRange
    };

    this.props.onEditRasterData(data);

    // var form = $(this.form).serializeArray();
    // if (form[0]['value'] && form[1]['value'] && form[2]['value']){
    //   var variable = {
    //     name: form[2]['value'],
    //     node: [
    //       'raster',
    //       this.props.spatialDomain,
    //       [
    //         JSON.parse(form[0]['value']),
    //         form[1]['value']
    //       ]
    //     ]
    //   };
    //   this.setState({
    //     variable: variable
    //   });
    // }
  };

  render() {
    return (
      <Panel header="Raster data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="rightSelect">
            <ControlLabel>Raster</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="right"
              value={this.props.editingRasterData.raster}
            >
              {
                this.props.raster_catalog.items.map((r, i) => (
                  <option key={i} value={
                    `{"name": "${r.description}", "id": "${r.name}"}`
                  }>
                    {r.description + ': ' + r.band}
                  </option>
                ))
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="range">
            <ControlLabel>Temporal&nbsp;Range</ControlLabel>
            <FormControl
              name="dates"
              type="text"
              placeholder="enter like 2000-001,2000-31"
              value={this.props.editingRasterData.temporalRange}
            />
          </FormGroup>
          <FormGroup controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text" placeholder="enter variable name"
              value={this.props.editingRasterData.name}
            />
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
        </form>
      </Panel>
    );
  }
}

class ExpressionEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  onTreeChange() {
    console.log(this.props.children.type);
    this.props.onAddTreeOp(this.props.children.type.json());
  }

  render() {
    if (this.props.tree[0]) {
      var RootNode = treeToNode(this.props.tree[0]);
    } else {
      var RootNode = EmptyTree;
    }
    return (
      <Panel header="Expression editor">
        <FormGroup controlId="name" validationState={this.props.errors.name ? 'error' : null}>
          <FormControl componentClass="input"
            placeholder="Name..."
            onChange={this.props.onNameChange}
            value={this.props.name} />
          <HelpBlock>{this.props.errors.name ? this.props.errors.name : "Name must be alphanumeric, without spaces."}</HelpBlock>
        </FormGroup>
        <Panel>
          <div className="pull-right">
            <ButtonGroup>
              <Button onClick={this.props.onInitTree.bind(this, ['+', [2,1]])}>+</Button>
              <Button>-</Button>
              <Button>*</Button>
              <Button>/</Button>
              <Button>Temporal Mean</Button>
              <Button>Spatial Mean</Button>
            </ButtonGroup>
          </div>
        </Panel>
        <Panel>
          <RootNode tree={this.props.tree} node_id={0} onEditTreeNode={this.props.onEditTreeNode} />
        </Panel>
      </Panel>
    );
  }
}

class VariableTable extends React.Component {
  render() {
    if (this.props.input_variables.length > 0){
      var item = this.props.input_variables[0];
    }
    return (
      <Panel header="Variables">
        <Table striped>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Dimensions</th>
            </tr>
          </thead>

        </Table>
      </Panel>
    );
  }
}

class SieveComponent extends React.Component {
  render() {
    var self = this;

    function createMarkup() { return {__html: treeToNode(self.props.tree).html(0)}; };
    function returnHTML(html) { return {__html: html}};

    var onSave = (e) => {
      e.stopPropagation();
      if (self.props.errors.name || self.props.errors.tree){
        return;
      }
      self.props.onSaveVariable({
        id: self.props.id,
        name: self.props.name,
        tree: self.props.tree,
        input_variables: self.props.input_variables,
        description: self.props.description,
        temporal_domain: self.props.temporal_domain,
        spatial_domain: self.props.spatial_domain
      }, self.props.created);
    };

    return (
      <div className="sieve">
        <Row className="show-grid">
          <Col xs={11}>
            <SpatialConfiguration
              onSpatialDomainChange={this.props.onSpatialDomainChange}
              spatialDomain={this.props.spatialDomain}
              layers={this.props.layers} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={5}>
            <TabularDataSource
              onAddInputVariable={this.props.onAddInputVariable}
              onEditTabularData={this.props.onEditTabularData}
              editingTabularData={this.props.editingTabularData}
              layers={this.props.layers}
              tables={this.props.tables}
            />
          </Col>
          <Col xs={5} xsOffset={1}>
            <RasterDataSource
              onAddInputVariable={this.props.onAddInputVariable}
              onEditRasterData={this.props.onEditRasterData}
              editingRasterData={this.props.editingRasterData}
              raster_catalog={this.props.raster_catalog}
              spatialDomain={this.props.spatialDomain}
          />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <ExpressionEditor
              tree={this.props.tree}
              onInitTree={this.props.onInitTree}
              onEditTreeNode={this.props.onEditTreeNode}
              onNameChange={this.props.onNameChange}
              errors={this.props.errors} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <VariableTable
              onRemoveInputVariable={this.props.onRemoveInputVariable}
              input_variables={this.props.input_variables}
            />
          </Col>
        </Row>
      </div>
    );
  }
}

var tab = (level) => {return Array(level * 4).join("&nbsp;")};
var formatHtml = (html, level) => {return tab(level) + html;};

class OperandChooser extends React.Component {
  constructor(props) {
    super(props);

    this.selectKeyToVal = {};
    this.props.operands.forEach((operand) => {
      this.selectKeyToVal[operand.toString()] = operand;
    });
  }

  onChangeOperand(e) {
    this.props.onEditTreeNode(this.props.node_id, this.selectKeyToVal[e.target.value]);
  }

  render() {
    return (
      <select style={{display: "inline-block", width: 100}} onChange={this.onChangeOperand.bind(this)} value={this.props.value}>
        {this.props.operands.map((operand) => {
          return <option value={operand}>{operand}</option>;
        })}
      </select>
    );
  }
}

class DataNode extends React.Component {
  constructor(operands) {
    super();
  }

  json() {
    return JSON.encode(data);
  }

  render(text, level=0, newline=true) {
    var output = tab(level) + text + " (" + this.dimensions + ")";
    if (newline) {
      output += "<br>";
    }
    return output;
  }
}

class MeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 2) {
        throw Error("MeanOperator takes exactly 2 operands");
    }

    this.left = treeToNode(operands[0]);
    this.right = treeToNode(operands[1]);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['mean', [this.left.json(), this.right.json()]];
  }

  render(level, nl=true) {
    return super.html('Mean of ( <br>' +
      this.left.html(level + 1) +
      this.right.html(level + 1) +
      tab(level) + ')', level, nl);
  }
}

class TemporalMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("TemporalMeanOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'space';
  }

  json() {
    return ['tmean', [this.operand.json()]];
  }

  render(level, nl=true) {
    return super.html('Time mean of ( <br>' +
      this.operand.html(level + 1) +
      tab(level) + ')', level, nl);
  }
}

class SpatialMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("SpatialMeanOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'time';
  }

  json() {
    return ['smean', [this.operand.json()]];
  }

  render(level, nl=true) {
    return super.html('Space mean of ( <br>' +
      this.operand.html(level + 1) +
      tab(level) + ')', level, nl);
  }
}

class SelectOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 2) {
      throw Error("SelectOperator takes exactly 2 operands");
    }

    this.left = treeToNode(operands[0]);
    this.child_op = operands[0][0];
    this.right = operands[1];

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['select', [this.left.json(), this.right.json()]];
  }

  render(level, nl=true) {
    return super.html("Select " + this.right.name + "/" + this.right.field + " from (<br>" +
      tab(level) + this.left.html(level + 1) +
      tab(level) + ")", level, nl);
  }
}

class ExpressionOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("ExpressionOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = this.operand.dimensions;
  }

  json() {
    return ['expression', [this.operand.json()]];
  }

  render(level, nl=true) {
    return super.html(this.operand.html(level), level, nl);
  }
}

class JoinOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 2) {
      throw Error("JoinOperator takes exactly 2 operands");
    }

    this.left = new SourceOperator([operands[0]]);
    this.right = new SourceOperator([operands[1]]);

    var dimensions = new Set();
    dimensions.add(this.left.dimensions);
    dimensions.add(this.right.dimensions);

    this.dimensions = '';
    if (dimensions.has('space')) {
      this.dimensions += 'space';
    }
    if (dimensions.has('time')) {
      this.dimensions += 'time';
    }
  }

  json() {
    return ['join', [this.left.json(), this.right.json()]];
  }

  render(level, nl=true) {
    return super.html("Join " +
      this.left.type + ' ' + this.left.name + ' and ' +
      this.right.type + ' ' + this.right.name + ' on ' +
      this.left.field + ' = ' + this.right.field, level, nl);
  }
}

class RasterOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 3) {
      throw Error("RasterOperator takes exactly 3 operands");
    }

    this.left = operands[0];
    this.middle = operands[2];
    this.right = treeToNode(operands[1]);

    this.dimensions = 'spacetime';
  }

  json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  }

  render(level, nl=true) {
    return super.html("Raster " + this.left.name + " in " + this.middle + " by (" + this.right.html(0, false) + ")", level, nl);
  }
}

class SourceOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("SourceOperator takes exactly 1 operand");
    }

    this.operand = operands[0];
    this.name = this.operand.name;
    this.type = this.operand['type'];
    this.field = this.operand.field;

    if (this.type == 'Layer') {
      this.dimensions = 'space';
    } else if (this.type == 'Table') {
      this.dimensions = 'time';
    }
  }

  json() {
    return ['source', [{name: this.name, type: this.type, field: this.field}]];
  }

  render(level, nl=true) {
    return super.html(this.operand.type + " '" + this.operand.name + "' ", level, nl);
  }
}

class MathOperator extends React.Component {
  constructor(props) {
    super(props);

    var operator = props.tree[props.node_id][0];
    var operands = props.tree[props.node_id][1].map((operand_id) => {
      return props.tree[operand_id];
    });

    this.left_id = props.tree[props.node_id][1][0];
    this.right_id = props.tree[props.node_id][1][1];

    this.operator = operator;

    if (operands.length != 2) {
      throw Error("MathOperator takes exactly 2 operands");
    }

    this.left = treeToNode(operands[0]);
    this.right = treeToNode(operands[1]);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    this.dimensions = this.left.dimensions;
  }

  componentWillUpdate(nextProps) {
    this.operator = nextProps.tree[nextProps.node_id][0];

    this.left_id = nextProps.tree[nextProps.node_id][1][0];
    this.right_id = nextProps.tree[nextProps.node_id][1][1];

    this.left = treeToNode(nextProps.tree[this.left_id]);
    this.right = treeToNode(nextProps.tree[this.right_id]);
  }

  onChangeLeftOperand(e) {
    this.left = e.target.value;

    this.props.onTreeChange();
  }

  onChangeRightOperand(e) {
    this.left = e.target.value;

    this.props.onTreeChange();
  }

  json() {
    return [this.operator, [this.left.json(), this.right.json()]];
  }

  render() {
    return (
      <span>
        <OperandChooser node_id={this.left_id} operands={[1,2]} value={this.left} onEditTreeNode={this.props.onEditTreeNode} />
        {this.operator}
        <OperandChooser node_id={this.right_id} operands={[1,2]} value={this.right} onEditTreeNode={this.props.onEditTreeNode} />
      </span>
    );
  }
}

class EmptyTree extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return null;
  }
}

function treeToNode(tree) {
  if (Object.keys(tree).length == 0) {
    return EmptyTree;
  }

  switch (tree[0]) {
    case 'mean':
      return MeanOperator;
    case 'tmean':
      return TemporalMeanOperator;
    case 'smean':
      return SpatialMeanOperator;
    case 'select':
      return SelectOperator;
    case 'expression':
      return ExpressionOperator;
    case 'join':
      return JoinOperator;
    case 'raster':
      return RasterOperator;
      break;
    case 'source':
      return SourceOperator;
    case '+':
    case '-':
    case '*':
    case '/':
      return MathOperator;
    case 'const':
      return tree[1];
    default:
      throw Error("'" + tree[0] + "' is not a valid operator");
  }
}

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
  store.dispatch(receiveRasterCatalog(raster_catalog));

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

const {
  Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Tabs, DropdownButton, MenuItem,
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
  changed: false
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
    case ADD_TREE_NODE:
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
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: (i) => {
      dispatch(removeInputVariable(i));
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
        {this.props.errors.detail ? <Alert bsStyle="danger">{this.props.errors.detail}</Alert> : null}
        <Panel header={
          this.props.created ?
          <h3>
            Variable {this.props.name}
            <small>  created on {this.props.created} and last modified {this.props.modified}</small>
          </h3> : null
        }>
          <div className="sieve-metadata">
            <div className="sieve-metadata-title">
              {this.props.created ? null :
                <FormGroup controlId="name" validationState={
                  this.props.errors.name ? 'error' : null
                }>
                  <FormControl
                    componentClass="input"
                    placeholder="Name..."
                    initialValue={self.props.name}
                    onChange={self.props.onNameChange}
                    value={self.props.name}
                  />
                  <HelpBlock>{
                    this.props.errors.name ?
                    this.props.errors.name :
                    "Name must be alphanumeric, without spaces."
                  }</HelpBlock>
                </FormGroup>
              }
            </div>
            <div className="sieve-metadata-description">
              <FormGroup controlId="name">
                <FormControl
                  componentClass="textarea"
                  placeholder="Description..."
                  initialValue={self.props.description}
                  value={self.props.description}
                  onChange={self.props.onDescriptionChange}
                  style={{resize:"vertical"}}
                />
              </FormGroup>
            </div>
          </div>
        </Panel>

        <Panel header={<h3>Input Variables</h3>}>
          {this.props.input_variables.length ?
            <dl>{
            this.props.input_variables.map((variable, idx)=>{
              return [
                <dt>
                  {variable.name}
                  <div className='pull-right'>
                    <a className='btn btn-sm' onClick={() => self.props.onRemoveInputVariable(idx)}>Remove</a>
                  </div>
                </dt>,
                <dd dangerouslySetInnerHTML={{__html: treeToNode(variable.node).html(0)}}></dd>
              ];
            })
            }</dl>
            : "Add some!"
          }
          <div className='pull-right'>
            <ButtonToolbar>
              <ButtonGroup>
                <AddLayerInputModal {...this.props} >Add Spatial Layer</AddLayerInputModal>
                <AddTableInputModal {...this.props} >Add Tabular/Time Data</AddTableInputModal>
                <AddDataInputModal {...this.props} >Combine Space/Time Data</AddDataInputModal>
                <AddRasterInputModal {...this.props} >Add Raster Data</AddRasterInputModal>
                <AddExpressionInputModal {...this.props} >Add Expression Input</AddExpressionInputModal>
                <AddSelectInputModal {...this.props}>Select Input</AddSelectInputModal>
              </ButtonGroup>
            </ButtonToolbar>
          </div>
        </Panel>

        <Panel header={<h3>Operation Tree</h3>}>
          <div className='pull-right'>
            <ButtonToolbar>
              <ButtonGroup>
                <AddSelectModal op='select' {...this.props}>Select Attribute</AddSelectModal>
                <AddMeanModal op='mean' {...this.props}>Mathematical Mean</AddMeanModal>
                <AddUnaryOpModal op='tmean' {...this.props}>Temporal Mean</AddUnaryOpModal>
                <AddUnaryOpModal op='smean' {...this.props}>Spatial Mean</AddUnaryOpModal>
                <AddBinOpModal op='*' {...this.props}>x</AddBinOpModal>
                <AddBinOpModal op='/' {...this.props}>/</AddBinOpModal>
                <AddBinOpModal op='+' {...this.props}>+</AddBinOpModal>
                <AddBinOpModal op='-' {...this.props}>-</AddBinOpModal>
              </ButtonGroup>
            </ButtonToolbar>
          </div>
          <br/>
          {this.props.errors.tree ?
            <Alert bsStyle="danger">
            <p>{this.props.errors.tree}</p>
            </Alert>
          : null}
          <p dangerouslySetInnerHTML={createMarkup()}>
          </p>

        </Panel>
        {self.props.changed && !self.props.errors.name && !self.props.errors.tree ?
          <Button onClick={onSave}>Save</Button>
          :
          null
        }
      </div>
    );
  }
}

var tab = (level) => {return Array(level * 4).join("&nbsp;")};
var formatHtml = (html, level) => {return tab(level) + html + "<br>";};

class DataNode {
  constructor(operands) {
    
  }

  json() {
    return JSON.encode(data);
  }

  html(level) {
    return this.json()
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
  }

  html(level) {
    return formatHtml('Mean of ( <br>' +
      this.left.html(level + 1) +
      this.right.html(level + 1) +
      tab(level) + ') ', level);
  }
}

class TemporalMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("TemporalMeanOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);
  }

  html(level) {
    return formatHtml('Time mean of ( <br>' +
      this.operand.html(level + 1) +
      tab(level) + ') ', level);
  }
}

class SpatialMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("SpatialMeanOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);
  }

  html(level) {
    return formatHtml('Space mean of ( <br>' +
      this.operand.html(level + 1) +
      tab(level) + ') ', level);
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
  }

  html(level) {
    return formatHtml("Select " + this.right.name + "/" + this.right.field + " from (<br>" +
      tab(level) + this.left.html(level + 1) +
      tab(level) + ")", level);
  }
}

class ExpressionOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("ExpressionOperator takes exactly 1 operand");
    }

    this.operand = treeToNode(operands[0]);
  }

  html(level) {
    return formatHtml(this.operand.html(level), level);
  }
}

class JoinOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 2) {
      throw Error("JoinOperator takes exactly 2 operands");
    }

    this.left = operands[0];
    this.right = operands[1];
  }

  html(level) {
    return formatHtml("Join " +
      this.left.type + ' ' + this.left.name + ' and ' +
      this.right.type + ' ' + this.right.name + ' on ' +
      this.left.field + ' = ' + this.right.field, level);
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
  }

  html(level) {
    return formatHtml("Raster " + this.left.name + " in " + this.middle + " by " + this.right.html(level + 1), level);
  }
}

class SourceOperator extends DataNode {
  constructor(operands) {
    super(operands);

    if (operands.length != 1) {
      throw Error("SourceOperator takes exactly 1 operand");
    }

    this.operand = operands[0];
  }

  html(level) {
    return formatHtml(this.operand.type + " '" + this.operand.name + "'", level);
  }
}

class EmptyTree extends DataNode {
  constructor() {
    super([]);
  }

  html() {
    return '';
  }
}

function treeToNode(tree) {
  var node;

  if (Object.keys(tree).length == 0) {
    return new EmptyTree();
  }

  switch (tree[0]) {
    case 'mean':
      node = new MeanOperator(tree[1]);
      break;
    case 'tmean':
      node = new TemporalMeanOperator(tree[1]);
      break;
    case 'smean':
      node = new SpatialMeanOperator(tree[1]);
      break;
    case 'select':
      node = new SelectOperator(tree[1]);
      break;
    case 'expression':
      node = new ExpressionOperator(tree[1]);
      break;
    case 'join':
      node = new JoinOperator(tree[1]);
      break;
    case 'raster':
      node = new RasterOperator(tree[1]);
      break;
    case 'source':
      node = new SourceOperator(tree[1]);
      break;
    default:
      throw Error("'" + tree[0] + "' is not a valid operator");
  }

  return node;
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

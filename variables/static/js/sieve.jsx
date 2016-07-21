var Table = ReactBootstrap.Table;
var Panel = ReactBootstrap.Panel;
var ButtonGroup = ReactBootstrap.ButtonGroup;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var ButtonInput = ReactBootstrap.ButtonInput;
var Button = ReactBootstrap.Button;
var Row = ReactBootstrap.Row;
var Col = ReactBootstrap.Col;
var Alert = ReactBootstrap.Alert;
var Input = ReactBootstrap.Input;
var OverlayTrigger = ReactBootstrap.OverlayTrigger;
var Tooltip = ReactBootstrap.Tooltip;
var Tabs = ReactBootstrap.Tabs;
var Tab = ReactBootstrap.Tab;
var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;
var Modal = ReactBootstrap.Modal;

/* trying to be cute but not parsing:\
const {
  Table, Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col, Alert
  Input, OverlayTrigger, Tooltip, Tabs, Tab, DropdownButton, MenuItem
} = ReactBootstrap;
*/

/* app */

var initialState = Object.assign({
  title: "",
  description: "",
  variableText: "",
  filters: [],
  spatialDomain: null,
  temporalDomain: {start: null, end: null},
  aggregateDimension: "NA",
  aggregateMethod: null,

  errors: {},
  position: 0
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
        variableText: action.text
      });
    default:
      return state;
  }
}

var mapStateToProps = (state) => {
  return Object.assign({}, state, {
    metadata: {title: state.title, description: state.description},
    tree: state.variableText,
    variables: [
      state.layers,
      state.variables,
      state.tables
    ],
    input_variables: [],
    layers: state.layers,
    tables: state.tables
  });
};

var mapDispatchToProps = (dispatch) => {
  return {
    onMetadataChange: (metadata) => {
      dispatch(updateMetadata(metadata));
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
}

class VariableButtonGroup extends React.Component {
  /*static propTypes = {
    onclick: React.PropTypes.func.isRequired;
    variables: React.PropTypes.arrayOf(React.PropTypes.shape({
    name: React.PropTypes.number.isRequired,
    items: React.PropTypes.array.isRequired
  }).isRequired).isRequired*/

  render(){
    var join = null;
    if (this.props.tables.items.length && this.props.layers.items.length){
      join = <JoinZard {...this.props} >Join</JoinZard>;
    }
    return <div className='pull-right'>
      {join}
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
    </div>;
  }
}


class JoinForm extends React.Component {
  render() {
    var {
      fields: {left, right, column},
      resetForm, handleSubmit, submitting
    } = this.props;
    return (
      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" placeholder="Left variable" {...left} />
        </div>
      </form>
    );
  }
}

class JoinZard extends React.Component {
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
    this.setState({ showModal: false });
  }

  render(){
    return (
      <div className='pull-right'>
        <Button
          bsStyle="primary"
          onClick={this.open.bind(this)}
        >
          Join
        </Button>

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>Text in a modal</h4>
          </Modal.Body>
          <Modal.Footer>
           <Button onClick={this.use.bind(this)}>Use Variable</Button>
           <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
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
        <Panel>
          <Row>
            <Col sm={4}>
              <h3>Configure Start Date</h3>
              <TemporalConfigurator
                date={this.props.temporalDomain.start}
                dateUpdated={this.updateStartDate.bind(this)}
                ref="dateStart" />
            </Col>
            <Col sm={4}>
              <h3>Configure End Date</h3>
              <TemporalConfigurator
                date={this.props.temporalDomain.end}
                dateUpdated={this.updateEndDate.bind(this)}
                ref="dateEnd" />
            </Col>
            <Col sm={4}>
              <h3>Interval Duration</h3>
              <IntervalConfigurator {...this.props} />
            </Col>
          </Row>
        </Panel>
        {/*<Panel>
          <Col>
            <SpatialConfigurator {...this.props} />
          </Col>
        </Panel>*/}
        <Panel>
          <ButtonToolbar>
            <ButtonGroup>
              <Button onClick={() => {positionedInsert('*')}}>x</Button>
              <Button onClick={() => {positionedInsert('/')}}>/</Button>
              <Button onClick={() => {positionedInsert('+')}}>+</Button>
              <Button onClick={() => {positionedInsert('-')}}>-</Button>
            </ButtonGroup>
            <VariableButtonGroup {...this.props} />
          </ButtonToolbar>
          <Input type="textarea"
            style={{resize: "vertical"}}
            ref="variableEditor"
            value={this.props.variableText}
            onChange={(e)=> this.props.onVariableTextChange(e.target.value) }
          />
          <Filter filters={this.props.filters} updateFilters={this.updateFilters.bind(this)} />
        </Panel>
        <Panel>
          <Aggregate
            dimension={this.props.aggregateDimension}
            method={this.props.aggregateMethod}
            updateAggregateDimension={this.updateAggregateDimension.bind(this)}
            updateAggregateMethod={this.updateAggregateMethod.bind(this)} />
        </Panel>
        <ButtonInput bsSize="large" onClick={this.saveVariable.bind(this)}>Save</ButtonInput>
      </div>
    );
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

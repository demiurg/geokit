const {
  Panel, ButtonGroup, ButtonToolbar, ButtonInput, Button, Row, Col,
  Alert, Tabs, Tab, DropdownButton, MenuItem, Table, Glyphicon,
  Modal, FormControl, ControlLabel, FormGroup, HelpBlock,
} = ReactBootstrap;

/* app */

var initialState = Object.assign({
  id: null,
  errors: {"name": null, "tree": null},
  name: "",
  tree: [],
  description: "",
  spatial_domain: null,
  input_variables: [],
  modified: null,
  created: null,
  changed: false,
  node_editor: {mode: DEFAULT},
  tabular_data: {},
  raster_data: {},
  expression_data: {},
  operandSelections: {},
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
    case RECEIVE_INPUT_VARIABLES:
      return Object.assign({}, state, {
        input_variables: action.input_variables,
        spatial_domain: action.spatial_domain
      });
    case RECEIVE_RASTER_CATALOG:
      return Object.assign({}, state, {
        raster_catalog: rasterCatalog(state.raster_catalog, action)
      });
    case UPDATE_NAME:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        changed: true,
        name: action.name,
        errors: Object.assign({}, state.errors, errors)
      });
    case UPDATE_DESCRIPTION:
      return Object.assign({}, state, {
        changed: true,
        description: action.description
      });
    case UPDATE_SPATIAL_DOMAIN:
      return Object.assign({}, state, {
        spatial_domain: action.layer_id
      });
    case UPDATE_TREE:
      return Object.assign({}, state, {
        changed: true,
        tree: action.tree.json ? action.tree.json : action.tree,
        errors: Object.assign({}, state.errors, {tree: action.error})
      });
    case UPDATE_ERRORS:
      return Object.assign({}, state, {
        errors: action.errors
      });
    case ADD_INPUT_VARIABLE:
    case REMOVE_INPUT_VARIABLE:
    case UPDATE_INPUT_VARIABLE:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        changed: true,
        errors: Object.assign({}, state.errors, errors),
        input_variables: input_variables(state.input_variables, action),
      });
    case ERROR_INPUT_VARIABLE:
      var errors = {};
      errors[action.field] = action.error;
      return Object.assign({}, state, {
        errors: Object.assign({}, state.errors, errors)
      });
    case CHANGE_OPERAND_SELECTION:
      return Object.assign({}, state, {
        operandSelections: operandSelections(state.operandSelections, action)
      });
    case UPDATE_MODIFIED:
      return Object.assign({}, state, {
        modified: action.time
      });
    case UPDATE_CREATED:
      return Object.assign({}, state, {
        created: action.time
      });
    case EDIT_NODE:
      return Object.assign({}, state, {
        node_editor: node_editor(state.node_editor, action)
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
    onUpdateName: (name, field) => {
      dispatch(updateName(name, field));
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
    onUpdateTree: (tree) => {
      dispatch(updateTree(tree));
    },
    onAddInputVariable: (variable) => {
      dispatch(addInputVariable(variable));
    },
    onRemoveInputVariable: (i) => {
      dispatch(removeInputVariable(i));
    },
    onEditInputVariable: (variable, node, i) => {
      dispatch(editInputVariable(variable, node, i));
    },
    onUpdateInputVariable: (variable, i) => {
      dispatch(updateInputVariable(variable, i));
    },
    onChangeOperandSelection: (id, value) => {
      dispatch(changeOperandSelection(id, value));
    },
    onEditNothing: () => {
      dispatch(editNothing());
    },
    onAddDataSource: () => {
      dispatch(addDataSource());
    },
    onAddExpression: () => {
      dispatch(addExpression());
    },
    onUpdateRasterData: (data) => {
      dispatch(updateRasterData(data));
    },
    onUpdateTabularData: (data) => {
      dispatch(updateTabularData(data));
    },
    onUpdateExpressionData: (data) => {
      dispatch(updateExpressionData(data));
    }
  };
};

/* components */

//  layer or table item to bare dict option
var i2o = (type, item, i) => { return (item, i) => {
  if (item.field_names){
    return item.field_names.map((field, j) => (
      <option value={
        `{"type":"${type}","name":"${item.name}","id":${item.id},"field":"${field}"}`
      }>
        {`${item.name}/${field}`}
      </option>
    ))
  }
}};

class SpatialConfiguration extends React.Component {
  componentDidMount() {
    var map = this.map = L.map('spatial-config-map').setView([0, 0], 2);

    this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'ags.n5m0p5ci',
        accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
    }).addTo(map);

    if (this.props.spatial_domain) {
      this.updateMap(this.props.spatial_domain);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.spatial_domain != this.props.spatial_domain) {
      if (this.geoJsonTileLayer)
        this.map.removeLayer(this.geoJsonTileLayer);

      if (this.props.spatial_domain) {
        this.updateMap(this.props.spatial_domain);
      }
    }
  }

  updateMap(layer_id) {
    var geoJsonURL = '/layers/' + layer_id + '/{z}/{x}/{y}.json';
    this.geoJsonTileLayer = new L.TileLayer.GeoJSON(geoJsonURL, {
      clipTiles: true,
      unique: function(feature) {
        return feature.properties.id;
      }
    }, {
      style: {
        weight: 1
      },
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

    $.ajax('/api/layers/' + layer_id, {
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

  render() {
    var layer_options = this.props.layers.items.map((layer) => {
      return { value: layer.id, label: layer.name };
    });

    return (
      <Panel header="Spatial configuration">
        <Select value={this.props.spatial_domain} options={layer_options}
                onChange={this.props.onSpatialDomainChange} />
        <div id="spatial-config-map" style={{height: 400, marginTop: 10}}></div>
      </Panel>
    );
  }
}


class VariableTable extends React.Component {
  useInputVariable = (item, name) => {
    if (!this.props.name){
      this.props.onUpdateName(name)
    }
    this.props.onUpdateTree(item);
  }

  render() {
    if (this.props.input_variables.length > 0){
      var table = (
        <Table striped>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {this.props.input_variables.map((node, i) => {
              return (
                <tr>
                  <td>{node.name}</td>
                  <td>{node.value.type}</td>
                  <td>{node.value.dimensions}</td>
                  <td>
                    <Button onClick={
                      () => this.useInputVariable(node.json(), node.name)
                    }>Use</Button>
                    <Button onClick={
                      () => this.props.onEditInputVariable(node, i)
                    }>Edit</Button>
                  </td>
                  <td>
                    <Button
                        onClick={() => {this.props.onRemoveInputVariable(i)}}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      );
    } else {
      table = <p></p>;
    }
    return (
      <Panel header="Variables">
        <div className="pull-right">
          <Button disabled={this.props.input_variables.length == 0}
                  onClick={() => this.props.onAddExpression()}>
            Add Expression
          </Button>
          <Button disabled={!this.props.spatial_domain}
                  onClick={() => this.props.onAddDataSource()}>
            Add Data Source
          </Button>
        </div>
        {table}
      </Panel>
    );
  }
}

var node2tree  = (node) => {
  var buildTree = (node, tree, branch) => {
    if (branch[0] == 'const'){
      tree.push(branch[1]);
      return tree;
    } else {
      tree.push(branch[0]);
      var subPaths = branch[1];
      var subBranch = [];
      subPaths.forEach((element) => {
        buildTree(node, subBranch, node[element]);
      });
      tree.push(subBranch);
      return tree;
    };
  }
  return buildTree(node, [], node[0]);
}

class AddDataSourcePanel extends React.Component {
  render() {
    return (
      <Panel header="Add a data source">
        <Row>
          <Col md={6}>
            <Button
              onClick={() => this.props.onUpdateTabularData(null)}
              style={{width: '100%', margin: '0.83em 0'}}>
              <Glyphicon glyph="user" /> I want to use a user-submitted table
            </Button>
          </Col>
          <Col md={6}>
            <h2>Tabular Data</h2>
            <p>GeoKit users can provide specially formatted tabular data that GeoKit can use to render visualizations.</p>
            <p>Do you want to create a tabular data based visualization, but haven't uploaded your data yet?</p>
            <a href="#" className="button pull-right">Create some tabular data</a>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Button
              onClick={() => this.props.onUpdateRasterData(null)}
              style={{width: '100%', margin: '0.83em 0'}}>
              <Glyphicon glyph="cloud" /> I want to use GeoKit data
            </Button>
          </Col>
          <Col md={6}>
            <h2>Raster Data</h2>
            <p>GeoKit provides a service for reducing vast quantities of observational data to quantities that are practical for use in web applications for visualizing information about Earth.</p>
            <p>GeoKit raster data doesn't require any special setup beyond a small configuration step. Depending on the amount of data requested, the reduction procedure can take some time. Check the variables page to see information about the status of your variables.</p>
          </Col>
        </Row>
        <Button onClick={() => this.props.onEditNothing()}>Cancel</Button>
      </Panel>
    );
  }
}

class SieveComponent extends React.Component {
  saveVariable = () => {
    this.props.onSaveVariable({
      id: this.props.id,
      name: this.props.name,
      tree: this.props.tree,
      input_variables: this.props.input_variables.map((v) => DataNode.toTree(v)),
      description: this.props.description
    }, this.props.created);
  };

  renderMiddlePanel() {
    if (
      this.props.spatial_domain ||
      (
        this.props.input_variables.length
        && this.props.node_editor.mode == EDITING_EXPRESSION
      )
    ){
      switch (this.props.node_editor.mode) {
        case EDITING_EXPRESSION:
          return <ExpressionEditor {...this.props} />;
        case EDITING_RASTER_DATA:
          return <RasterDataSource {...this.props} />;
        case EDITING_TABULAR_DATA:
          return <TabularDataSource {...this.props} />;
        case ADDING_DATA_SOURCE:
          return <AddDataSourcePanel {...this.props} />;
        default:
          return null;
      }
    }
  }

  render() {
    var final_render = null;
    var valid = !this.props.errors.name && !this.props.errors.tree;

    this.props.name;
    if (this.props.tree && this.props.tree.length) {
      var final = treeToNode(this.props.tree);
      final_render = (<div>
        <form>
          <FormGroup controlId="range"
            validationState={this.props.errors.name ? "error" : null}
          >
            <FormControl
              name="name" type="text"
              placeholder="Use alphanumeric name without spaces."
              value={this.props.name ? this.props.name : null}
              onChange={(e) => {
                this.props.onUpdateName(e.target.value, 'name');
              }}
            />
            <HelpBlock>
              {this.props.errors.name ? this.props.errors.name : ""}
            </HelpBlock>
          </FormGroup>
        </form>
        <p>{final.render()}</p>
        <div className='btn-group'>
          {(this.props.changed && valid) ?
            <button
              className='button'
              onClick={this.saveVariable}
            >
              Save Changes
            </button>
          : null}
          {this.props.id ?
            <a
              href={`/admin/variables/delete/${this.props.id}`}
              className='button serious pull-right'
            >
              Delete
            </a>
          : null}
        </div>
        <p>
          <dl>
            <dt>Created</dt> <dd>{this.props.created}</dd>
            <dt>Last modified</dt> <dd>{this.props.modified}</dd>
            <dt>Rasters used</dt> <dd>{final.products.map(r => [r.render(), <br/>])}</dd>
          </dl>
        </p>
      </div>);
    } else {
      final_render = <p>Use controls to build and use the variable</p>;
    }
    return (
      <div className="sieve">
        <Row className="show-grid">
          <Col xs={11}>
            <SpatialConfiguration {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            {this.renderMiddlePanel()}
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <VariableTable {...this.props} />
          </Col>
        </Row>
        <Row className="show-grid">
          <Col xs={11}>
            <Panel header={<h3>Final {final ? final.dimensions : ''} variable</h3>}>
              {final_render}
            </Panel>
          </Col>
        </Row>
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
  store.dispatch(receiveRasterCatalog(window.raster_catalog));
  store.dispatch(receiveInputVariables(window.sieve_props.input_variables));

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

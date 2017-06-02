
class TabularDataSource extends React.Component {
  onSave() {
    var data = this.props.node_editor.tabular_data;

    if (data.errors.name || data.errors.table || data.errors.layer_field || data.errors.table_field)
      return; // Do not submit if there are errors
    var name = data.name;
    if (name == null || name.length == 0){
      name = data.default_name;
    }

    var variable = ['named', [
      name,
      [
        'join',
        [
          {'type': 'Layer', 'id': this.props.spatial_domain, 'field': data.layer_field},
          {'type': 'Table', 'id': data.table, 'field': data.table_field}
        ]
      ]]
    ];
    var index = data.index;
    var editing = data.editing;

    variable = DataNode.toNode(variable);

    if (editing){
      this.props.onUpdateInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateTabularData(null);
    this.props.onEditNothing();
  }

  componentWillReceiveProps(newProps){
    var data = this.props.node_editor.tabular_data;
    if (!newProps.node_editor.tabular_data.default_name ||
        newProps.input_variables != this.props.input_variables
      ){
      var t1 = newProps.tables.items[0];
      if (t1){
        var source1 = {name: t1.name, field: t1.field_names[0]};
        var source2 = Object.assign({}, source1);
        var name = this.generateName(newProps.node_editor.tabular_data.table, newProps.input_variables);
        var data = Object.assign(
          {},
          newProps.node_editor.tabular_data,
          {default_name: name}
        );

        if (!this.props.node_editor.tabular_data.source1){
          data.source1 = source1;
        }
        if (!this.props.node_editor.tabular_data.source2){
          data.source2 = source2;
        }
        this.props.onUpdateTabularData(data);
      }
    }
  }

  layerIdToName(layer_id) {
    return this.props.layers.items.filter((layer) => {
      return layer.id == layer_id;
    })[0].name;
  }

  tableIdToName(table_id) {
    return this.props.tables.items.filter((table) => {
      return table.id == table_id;
    })[0].name;
  }

  generateName(table, var_list=null) {
    if (table) {
      var name = `${this.layerIdToName(this.props.spatial_domain)}-${this.tableIdToName(table)}`;
    } else {
      return this.layerIdToName(this.props.spatial_domain) + '-';
    }
    name = name.replace(/_/g, "-");
    var i = 1;
    var input_variables = [];
    if (var_list){
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach((input) => {
      if ((name + '-' + i) == input.name ){
        i++;
      }
    });

    return name + '-' + i;
  }

  validate() {
    var form = $(this.form).serializeArray();

    var layer_field = form[0]['value'];
    var table = form[1]['value'];

    if (form.length == 4) {
      var table_field = form[2]['value'];
      var name = form[3]['value'];
    } else {
      var table_field = null;
      var name = form[2]['value'];
    }

    var default_name = this.generateName(table);

    var errors = {};
    if (!layer_field) {
      errors.layer_field = "Must select a layer field";
    }
    if (!table) {
      errors.table = "Must select a table";
    }
    if (!table_field) {
      errors.table_field = "Must select a table field";
    }

    var data = Object.assign(
      {},
      this.props.node_editor.tabular_data,
      {
        name: name,
        errors: errors,
        layer_field: layer_field,
        table: table,
        table_field: table_field,
        default_name: default_name
      }
    );

    this.props.onUpdateTabularData(data);
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

  render() {
    var data = this.props.node_editor.tabular_data;

    return (
      <Panel header="Tabular data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="formSelectLayerField"
            validationState={data.errors.layer_field ? 'error' : null}>
            <ControlLabel>Layer Field</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              value={data.layer_field}
              name="layer-field"
            >
              <option value={null}></option>
              {
                this.props.layers.items.filter((layer) => {
                  return layer.id == this.props.spatial_domain;
                })[0].field_names.map((field) => {
                  return <option value={field}>{field}</option>;
                })
              }
            </FormControl>
          </FormGroup>
          <FormGroup controlId="formSelectTable"
            validationState={data.errors.table ? 'error' : null}>
            <ControlLabel>Table</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              name="table"
              value={data.table}
            >
              <option value={null}></option>
              {
                this.props.tables.items.map((table) => {
                  return <option value={table.id}>{table.name}</option>;
                })
              }
            </FormControl>
          </FormGroup>
          {this.props.node_editor.tabular_data.table ?
            <FormGroup controlId="formSelectTableField"
              validationState={data.errors.table_field ? 'error' : null}>
              <ControlLabel>Table Field</ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="select"
                value={data.table_field}
                name="table-field">
                <option value={null}></option>
                {
                  this.props.tables.items.filter((table) => {
                    return table.id == this.props.node_editor.tabular_data.table;
                  })[0].field_names.map((field) => {
                    return <option value={field}>{field}</option>;
                  })
                }
              </FormControl>
            </FormGroup> : null}
          <FormGroup
            validationState={data.errors.name ? 'error' : null}
            controlId="name">
              <ControlLabel>Name</ControlLabel>
              <FormControl
                name="name" type="text"
                placeholder={data.default_name}
                value={data.name}
              />
              <HelpBlock>
                {data.errors.name ?
                  data.errors.name :
                  "Name must be alphanumeric, without spaces."}
              </HelpBlock>
          </FormGroup>
          <Button onClick={this.onSave.bind(this)}>Add</Button>
          <Button onClick={this.props.onEditNothing}>Cancel</Button>
        </form>
      </Panel>
    );
  }
}

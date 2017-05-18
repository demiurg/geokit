
class TabularDataSource extends React.Component {
  onSave() {
    if (this.props.errors.tabularDataName)
      return; // Do not submit if there are errors
    var name = this.props.node_editor.tabular_data.name;
    if (name == null || name.length == 0){
      name = this.props.node_editor.tabular_data.defaultName;
    }

    var variable = ['named', [
      name,
      [
        'join',
        [
          this.props.node_editor.tabular_data.source1,
          this.props.node_editor.tabular_data.source2
        ]
      ]]
    ];
    var index = this.props.node_editor.tabular_data.index;
    var isEditing = this.props.node_editor.tabular_data.isEditing;

    if (isEditing){
      this.props.onUpdateInputVariable(variable, index);
    } else {
      this.props.onAddInputVariable(variable);
    }

    this.props.onUpdateTabularData(null);
    this.props.onEditNothing();
  }

  componentWillReceiveProps(newProps){
    if (!newProps.node_editor.tabular_data.defaultName ||
        newProps.input_variables != this.props.input_variables
      ){
      var t1 = newProps.tables.items[0];
      if (t1){
        var source1 = {name: t1.name, field: t1.field_names[0]};
        var source2 = Object.assign({}, source1);
        var name = this.generateName(source1, source2, newProps.input_variables);
        var data = Object.assign(
          {},
          newProps.node_editor.tabular_data,
          {defaultName: name}
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

  generateName(source1, source2, var_list=null) {
    if (source1.name == source2.name){
      var name = source1.name + '-' + source1.field + '-' + source2.field;
    } else {
      var name = source1.name + '-' + source2.name;
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
    var name = form[2]['value'];
    if (name.length > 0){
      this.props.onUpdateName(name, "tabularDataName");
    }
    var source1 = JSON.parse(form[0]['value']);
    var source2 = JSON.parse(form[1]['value']);
    var defaultName = this.generateName(source1, source2);

    var data = Object.assign(
      {},
      this.props.node_editor.tabular_data,
      {
        name: name,
        source1: source1,
        source2: source2,
        defaultName: defaultName
      }
    );

    this.props.onUpdateTabularData(data);
  }

  sourceToString(source) {
    return JSON.stringify(source);
  }

  render() {
    return (
      <Panel header="Tabular data">
        <form ref={(ref)=>{this.form=ref}} onChange={this.validate.bind(this)}>
          <FormGroup controlId="formSelectSource">
            <ControlLabel>Source 1</ControlLabel>
            <FormControl
              componentClass="select"
              placeholder="select"
              value={this.sourceToString(this.props.node_editor.tabular_data.source1)}
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
              value={this.sourceToString(this.props.node_editor.tabular_data.source2)}
            >
              {
                this.props.tables.items.map(
                  i2o('Table')
                ).concat(
                  this.props.layers.items.map(i2o('Layer'))
                )
              }
            </FormControl>
          </FormGroup>
          <FormGroup
          validationState={this.props.errors.tabularDataName ? 'error' : null}
          controlId="name">
            <ControlLabel>Name</ControlLabel>
            <FormControl
              name="name" type="text"
              placeholder={this.props.node_editor.tabular_data.defaultName}
              value={this.props.node_editor.tabular_data.name}
            />
            <HelpBlock>
              {this.props.errors.tabularDataName ?
                this.props.errors.tabularDataName :
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
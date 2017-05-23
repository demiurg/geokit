class OperandChooser extends React.Component {
  changeOperand(e) {
    var operand_refs = this.props.node_editor.expression_data.operand_refs;

    var operand_ref = e ? e.value : null;
    operand_refs[this.props.operand_index] = operand_ref;

    var data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {
        operand_refs: operand_refs,
        valid: operand_refs.reduce((acc, val) => acc && val)
      }
    );
    this.props.onUpdateExpressionData(data);
  }

  options() {
    var data = this.props.node_editor.expression_data;

    var valid_input_vars = data.node.validOperands(
      this.props.input_variables,
      data.operand_refs,
      this.props.operand_index
    );

    return valid_input_vars.map((input_var) => {
      return {value: input_var.name, label: input_var.name};
    });
  }

  render() {
    return (
      <div style={{display: "inline-block", width: 400}}>
        <Select
          onChange={(e) => this.changeOperand(e)}
          value={this.props.node_editor.expression_data.operand_refs[this.props.operand_index]}
          options={this.options()}
          clearable={true}
        />
      </div>
    );
  }
}

class TreeViewer extends React.Component {
  render() {
    var data = this.props.node_editor.expression_data;
    if (!data.node){
      return <p>Select operation above.</p>;
    }

    var operand_inputs = [];
    for (var i = 0; i < data.node.arity; i++) {
      operand_inputs.push(<OperandChooser {...this.props} operand_index={i} />);
    }

    return (
      <span>{data.op} ( <blockquote>{operand_inputs}</blockquote> )</span>
    );
  }
}


class ExpressionEditor extends React.Component {
  constructor(props) {
    super(props);

    this.props.onUpdateExpressionData(
      Object.assign(
        {},
        this.props.node_editor.expression_data.data,
        {default_name: this.generateName(props.input_variables)}
      )
    );
  }

  componentWillReceiveProps(newProps) {
    if (
      !newProps.node_editor.expression_data.default_name ||
        newProps.input_variables != this.props.input_variables
    ) {
      this.props.onUpdateExpressionData(
        Object.assign(
          {},
          this.props.node_editor.expression_data.data,
          {default_name: this.generateName(newProps.input_variables)}
        )
      );
    }
  }

  generateName(var_list=null) {
    var i =1;
    var input_variables = [];
    if (var_list) {
      input_variables = var_list;
    } else {
      input_variables = this.props.input_variables;
    }

    input_variables.forEach((input) => {
      if (input.name == 'expression-' + i) {
        i++;
      }
    });
    return 'expression-' + i;
  }

  changeName(e) {
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {name: e.target.value}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  addOp(op) {
    var node = DataNode.Class(op);
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {op: op, operand_refs: Array(node.arity), node: node}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  populateOperands(arity) {
    var operands = [];

    for (var i = 0; i < arity; i++) {
      var operand_tree = this.props.input_variables.filter((input_var) => {
        // This relies on unique names in input variables table.
        return input_var.name == this.props.node_editor.expression_data.operand_refs[i].name;
      })[0];

      operands.push(operand_tree);
    }

    return operands;
  }

  onSave() {
    var data = this.props.node_editor.expression_data;
    if (DataNode.isNode(data.node)) {
      if (!data.name || data.name == "") {
        data.name = data.default_name;
      }

      var node = treeToNode(data.node);
      if (node.type == 'named'){
        node.name = data.name;
      }else{
        node = DataNode.namedNode(data.name, node);
      }
      data.node[1] = this.populateOperands(node.arity);

      this.props.onUpdateExpressionData(data);
      this.props.onAddInputVariable(node);
      this.props.onEditNothing();
    }
  }

  render() {
    var data = this.props.node_editor.expression_data;

    return (
      <Panel header="Expression editor">
        <FormGroup controlId="name">
          <FormControl componentClass="input"
            placeholder={data.default_name}
            onChange={() => this.changeName()}
            value={data.name} />
        </FormGroup>
        <Panel>
          <div className="pull-right">
            <ButtonGroup>
              <Button onClick={(e) => this.addOp('+')}>+</Button>
              <Button onClick={(e) => this.addOp('-')}>-</Button>
              <Button onClick={(e) => this.addOp('*')}>*</Button>
              <Button onClick={(e) => this.addOp('/')}>/</Button>
              <Button onClick={(e) => this.addOp('mean')}>Arithmetic Mean</Button>
              <Button onClick={(e) => this.addOp('tmean')}>Temporal Mean</Button>
              <Button onClick={(e) => this.addOp('smean')}>Spatial Mean</Button>
            </ButtonGroup>
          </div>
        </Panel>
        <Panel>
          <TreeViewer {...this.props} />
        </Panel>
        {data.valid ? <Button onClick={this.onSave.bind(this)}>Add</Button> : null}
        <Button onClick={this.props.onEditNothing}>Cancel</Button>
      </Panel>
    );
  }
}
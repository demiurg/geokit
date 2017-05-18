
class ExpressionEditor extends React.Component {
  constructor(props) {
    super(props);

    var data = {defaultName: this.generateName(props.input_variables)};
    props.onUpdateExpressionData(data);
  }

  componentWillReceiveProps(newProps) {
    if (
      !newProps.node_editor.expression_data.defaultName ||
        newProps.input_variables != this.props.input_variables
    ) {
      var data = {defaultName: this.generateName(newProps.input_variables)};
      this.props.onUpdateExpressionData(data);
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
    var node_object = treeToNode(op);
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {node: op, operand_refs: Array(node_object.arity)}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  populateOperands(arity) {
    var operands = [];

    for (var i = 0; i < arity; i++) {
      var operand_tree = this.props.input_variables.filter((input_var) => {
        return input_var.name == this.props.node_editor.expression_data.operand_refs[i];
      })[0].node;

      operands.push(operand_tree);
    }

    return operands;
  }

  onSave() {
    var expression_data = this.props.node_editor.expression_data;
    if (DataNode.isNode(expression_data.node)) {
      if (!expression_data.name || expression_data.name == "") {
        expression_data.name = expression_data.defaultName;
      }

      var node = treeToNode(expression_data.node);
      if (node.type == 'named'){
        node.name = expression_data.name;
      }else{
        node = DataNode.namedNode(expression_data.name, node);
      }
      expression_data.node[1] = this.populateOperands(node.arity);

      this.props.onUpdateExpressionData(node);
      this.props.onAddInputVariable(expression_data);
      this.props.onEditNothing();
    }
  }

  render() {
    return (
      <Panel header="Expression editor">
        <FormGroup controlId="name">
          <FormControl componentClass="input"
            placeholder={this.props.node_editor.expression_data.defaultName}
            onChange={this.changeName.bind(this)}
            value={this.props.node_editor.expression_data.name} />
        </FormGroup>
        <Panel>
          <div className="pull-right">
            <ButtonGroup>
              <Button onClick={this.addOp.bind(this, ['+', [null, null]])}>+</Button>
              <Button onClick={this.addOp.bind(this, ['-', [null, null]])}>-</Button>
              <Button onClick={this.addOp.bind(this, ['*', [null, null]])}>*</Button>
              <Button onClick={this.addOp.bind(this, ['/', [null, null]])}>/</Button>
              <Button onClick={this.addOp.bind(this, ['tmean', [null]])}>Temporal Mean</Button>
              <Button onClick={this.addOp.bind(this, ['smean', [null]])}>Spatial Mean</Button>
            </ButtonGroup>
          </div>
        </Panel>
        <Panel>
          <TreeViewer {...this.props} tree={treeToNode(this.props.node_editor.expression_data.node)} />
        </Panel>
        <Button onClick={this.onSave.bind(this)}>Add</Button>
        <Button onClick={this.props.onEditNothing}>Cancel</Button>
      </Panel>
    );
  }
}
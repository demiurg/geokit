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

    var valid_input_vars = data.node_class.validOperands(
      this.props.input_variables,
      data.operand_refs,
      this.props.operand_index
    );

    return valid_input_vars.map((input_var) => {
      return {value: input_var.name, label: input_var.name};
    });
  }

  render() {
    var data = this.props.node_editor.expression_data;

    if (data.operand_refs) {
      return (
        <div style={{display: "inline-block", width: 400}}>
          <Select
            onChange={(e) => this.changeOperand(e)}
            value={data.operand_refs[this.props.operand_index]}
            options={this.options()}
            clearable={true}
          />
        </div>
      );
    } else {
      return null;
    }
  }
}

class TreeViewer extends React.Component {
  render() {
    var data = this.props.node_editor.expression_data;

    if (!data.node_class){
      return <p>Select operation above.</p>;
    }

    var operand_inputs = [];
    for (var i = 0; i < data.node_class.arity; i++) {
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

    let data = this.props.node_editor.expression_data;
    var operand_refs = [];
    if (data.operand_refs == null && data.node){
      var operands = data.node.operands();
      for (let onode of operands){
        for (let i=0; i<this.props.input_variables.length; i++){
          if (onode.isEquivalent(this.props.input_variables[i].value)){
            operand_refs.push(this.props.input_variables[i].name_operand);
            if (operand_refs.length == data.node_class.arity){
              break;
            }
          }
        }
      }
    }

    this.props.onUpdateExpressionData(
      Object.assign(
        {},
        data,
        {
          default_name: this.generateName(props.input_variables),
          operand_refs: data.operand_refs ? data.operand_refs : operand_refs,
          valid: data.node_class && operand_refs.length == data.node_class.arity
        }
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
          this.props.node_editor.expression_data,
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
    var data = this.props.node_editor.expression_data;
    var errors = {};
    var name = e.target.value;

    if((name && name.length > 0) && !name.match(/^[a-zA-Z0-9-]+$/)){
      errors['name'] = "Name must be alphanumeric, without spaces.";
    }else {
      var names = this.props.input_variables.map(v => v.name_operand);
      var i = names.indexOf(name);
      if(i > -1 && !(data.editing && data.index == i)){
        errors['name'] = "Name must not alread be used."
      }
    }
    var data = Object.assign(
      {},
      data,
      {name: name, errors: errors, valid: Object.keys(errors).length == 0}
    );
    this.props.onUpdateExpressionData(data);
  }

  addOp(op) {
    var node_class = DataNode.Class(op);
    var expression_data = Object.assign(
      {},
      this.props.node_editor.expression_data,
      {op: op, operand_refs: Array(node_class.arity), node_class: node_class}
    );
    this.props.onUpdateExpressionData(expression_data);
  }

  onSave() {
    var data = this.props.node_editor.expression_data;
    var rands = [];
    for (let name of data.operand_refs){
      for (let ivar of this.props.input_variables){
        if (name == ivar.name){
          // access named operand value here, throwing away name
          rands.push(ivar.value);
          break; // Just in case names are not unique now, this needs validation
        }
      }
    }

    var node = new data.node_class([data.op, rands]);
    if (!data.name || data.name == "") {
      data.name = data.default_name;
    }

    node = DataNode.nameNode(data.name, node);

    this.props.onUpdateExpressionData(data);
    this.props.onAddInputVariable(node);
    this.props.onEditNothing();
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

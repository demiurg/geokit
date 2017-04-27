class DataNode {
  validOperands(input_vars, operand_refs, op_index) {
    return input_vars;
  }

  json() {
    return JSON.encode(data);
  }
}

class MeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Mean';
    this.arity = 2;

    if (operands.length != this.arity) {
        throw Error(`MeanOperator takes exactly ${this.arity} operands`);
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
}

class TemporalMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Temporal Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`TemporalMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'space';
  }

  validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return treeToNode(input_var.node).dimensions.includes('time');
    });
  }

  json() {
    return ['tmean', [this.operand.json()]];
  }
}

class SpatialMeanOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Spatial Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`SpatialMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = 'time';
  }

  validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return treeToNode(input_var.node).dimensions.includes('space');
    });
  }

  json() {
    return ['smean', [this.operand.json()]];
  }
}

class SelectOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Select';
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`SelectOperator takes exactly ${this.arity} operands`);
    }

    this.left = treeToNode(operands[0]);
    this.child_op = operands[0][0];
    this.right = operands[1];

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['select', [this.left.json(), this.right.json()]];
  }
}

class ExpressionOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Expression';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`"ExpressionOperator takes exactly ${this.arity} operand`);
    }

    this.operand = treeToNode(operands[0]);

    this.dimensions = this.operand.dimensions;
  }

  json() {
    return ['expression', [this.operand.json()]];
  }
}

class JoinOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Join';
    this.arity = 2

    if (operands.length != this.arity) {
      throw Error(`JoinOperator takes exactly ${this.arity} operands`);
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
}

class RasterOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name = 'Raster';
    this.arity = 3;

    if (operands.length != this.arity) {
      throw Error(`RasterOperator takes exactly ${this.arity} operands`);
    }

    this.left = operands[0];
    this.middle = operands[2];
    this.right = treeToNode(operands[1]);

    this.dimensions = 'spacetime';
  }

  json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  }
}

class SourceOperator extends DataNode {
  constructor(operands) {
    super(operands);

    this.name= 'Source';
    this.arity = 1

    if (operands.length != this.arity) {
      throw Error(`SourceOperator takes exactly ${this.arity} operand`);
    }

    this.operand = operands[0];
    this.source_name = this.operand.name;
    this.type = this.operand['type'];
    this.field = this.operand.field;

    if (this.type == 'Layer') {
      this.dimensions = 'space';
    } else if (this.type == 'Table') {
      this.dimensions = 'time';
    }
  }

  json() {
    return ['source', [{source_name: this.name, type: this.type, field: this.field}]];
  }
}

class MathOperator extends React.Component {
  constructor(operator, operands) {
    super(operands);

    this.operator = operator;
    this.name = operator;
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`MathOperator takes exactly ${this.arity} operands`);
    }

    this.left = treeToNode(operands[0]);
    this.right = treeToNode(operands[1]);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    this.dimensions = this.left.dimensions;
  }

  validOperands(input_vars, operand_refs, op_index) {
    var other_op_index = op_index == 0 ? 1 : 0;
    var other_op = input_vars.filter(input_var => {
      return input_var.name == operand_refs[other_op_index];
    })[0];

    if (!other_op) {
      return input_vars;
    } else {
      var other_op_node = treeToNode(other_op.node);
      return input_vars.filter(input_var => {
        return treeToNode(input_var.node).dimensions == other_op_node.dimensions;
      });
    }
  }

  json() {
    return [this.operator, [this.left.json(), this.right.json()]];
  }
}

class EmptyTree extends DataNode {
  constructor(props) {
    super(props);

    this.name = 'Empty';
    this.arity = 0;
  }

  render() {
    return null;
  }
}

function treeToNode(tree) {
  var node;

  if (!tree || Object.keys(tree).length == 0) {
    return new EmptyTree();
  }

  switch (tree[0]) {
    case 'mean':
      return new MeanOperator(tree[1]);
    case 'tmean':
      return new TemporalMeanOperator(tree[1]);
    case 'smean':
      return new SpatialMeanOperator(tree[1]);
    case 'select':
      return new SelectOperator(tree[1]);
    case 'expression':
      return new ExpressionOperator(tree[1]);
    case 'join':
      return new JoinOperator(tree[1]);
    case 'raster':
      return new RasterOperator(tree[1]);
    case 'source':
      return new SourceOperator(tree[1]);
    case '+':
    case '-':
    case '*':
    case '/':
      return new MathOperator(tree[0], tree[1]);
    default:
      throw Error("'" + tree[0] + "' is not a valid operator");
  }
}

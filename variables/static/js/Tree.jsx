class DataNode {
  constructor(args){
    if (!Array.isArray(args)){
      throw Error("DataNode can only be initialized from Array.");
    } else if (args.length != 2){
      throw Error("DataNode needs 2 elements, operator and operand in Array.")
    }
    this._operation = args[0];
    this._operands = [];

    for (var i=0; i < args[1].length; i++){
      var rand = args[1][i];
      if (this.isDataTree(rand)){
        this._operands.push(treeToNode(rand));
      } else {
        this._operands.push(rand);
      }
    }
  }

  validOperands(input_vars, operand_refs, op_index) {
    return input_vars;
  }

  json() {
    return JSON.encode(data);
  }

  render(){
    var name = this.name ? this.name : "Unnamed";
    var arity = this.arity ? this.arity : 0;
    return (
      <span>
        {name} of {this._operands.map(
          (o) => this.isDataNode(o) ? o.render() : (o + ", ")
        )}
      </span>
    );
  }

  isDataTree(arg){
    return (
      Array.isArray(arg) &&
      arg.length == 2 &&
      NODE_TYPES_IMPLEMENTED.hasOwnProperty(arg[0])
    );
  }

  isDataNode(node){
    return node._operation && node._operands;
  }
}

class MeanOperator extends DataNode {
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Mean';
    this.arity = 2;

    if (operands.length != this.arity) {
        throw Error(`MeanOperator takes exactly ${this.arity} operands`);
    }

    this.left = this._operands[0];
    this.right = this._operands[1];

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
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Temporal Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`TemporalMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = this._operands[0];

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
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Spatial Mean';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`SpatialMeanOperator takes exactly ${this.arity} operand`);
    }

    this.operand = this._operands[0];

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
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Select';
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`SelectOperator takes exactly ${this.arity} operands`);
    }

    this.left = this._operands[0];
    this.child_op = operands[0][0];
    this.right = operands[1];

    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['select', [this.left.json(), this.right.json()]];
  }
}

class ExpressionOperator extends DataNode {
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Expression';
    this.arity = 1;

    if (operands.length != this.arity) {
      throw Error(`"ExpressionOperator takes exactly ${this.arity} operand`);
    }

    this.operand = this._operands[0];

    this.dimensions = this.operand.dimensions;
  }

  json() {
    return ['expression', [this.operand.json()]];
  }
}

class JoinOperator extends DataNode {
  constructor(tree) {
    super(tree);
    var operands = tree[1];

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
  constructor(tree) {
    super(tree);
    var operands = tree[1];

    this.name = 'Raster';
    this.arity = 3;

    if (operands.length != this.arity) {
      throw Error(`RasterOperator takes exactly ${this.arity} operands`);
    }

    this.left = operands[0];
    this.middle = operands[2];
    this.right = this._operands[1];

    this.dimensions = 'spacetime';
  }

  json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  }
}

class SourceOperator extends DataNode {
  constructor(tree) {
    super(tree);
    var operands = tree[1];

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
  constructor(tree) {
    super(tree);

    var operator = this.operator;
    var operands = tree[1];

    this.operator = operator;
    this.name = operator;
    this.arity = 2;

    if (operands.length != this.arity) {
      throw Error(`MathOperator takes exactly ${this.arity} operands`);
    }

    this.left = this._operands[0];
    this.right = this._operands[1];

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


var NODE_TYPES_IMPLEMENTED = {
  'mean': MeanOperator,
  'tmean': TemporalMeanOperator,
  'smean': SpatialMeanOperator,
  'select': SelectOperator,
  'expression': ExpressionOperator,
  'join': JoinOperator,
  'raster': RasterOperator,
  'source': SourceOperator,
  '+': MathOperator,
  '-': MathOperator,
  '*': MathOperator,
  '/': MathOperator,
};

function treeToNode(tree){
  if (!tree || Object.keys(tree).length == 0) {
    return new EmptyTree();
  } else {
    if (!NODE_TYPES_IMPLEMENTED.hasOwnProperty(tree[0])){
      throw Error("'" + tree[0] + "' is not a valid operator");
    } else {
      var Operator = NODE_TYPES_IMPLEMENTED[tree[0]];
      return new Operator(tree);
    }
  }
}

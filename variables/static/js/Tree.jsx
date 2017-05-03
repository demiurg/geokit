class DataNode {
  constructor(args, names, arity){
    if (!Array.isArray(args)){
      throw Error("DataNode can only be initialized from Array.");
    } else if (args.length != 2){
      throw Error("DataNode needs 2 elements, operator and operand in Array.")
    }
    this._operation = args[0];
    this._operands = [];

    if (names) {
      this.operand_names = names;
    }

    if (arity) {
      this.arity = arity;
    } else {
      this.arity = 0;
    }

    for (var i=0; i < args[1].length; i++){
      var rand = args[1][i];
      if (this.isDataTree(rand)){
        this._operands.push(treeToNode(rand));
      } else {
        this._operands.push(rand);
      }
    }

    if(this.operand_names){
      for (var i=0; i < this.operand_names.length; i++){
        this[this.operand_names[i]] = this._operands[i];
      }
    }

    if (this._operands.length != this.arity) {
      throw Error(`${this._operation} node takes exactly ${this.arity} operands`);
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
    var rands = null;
    if (this._operands.length){
      rands = this._operands.map(
        (o, i) => {
          console.log('>', o, this.isDataNode(o), '<');
          if(this.isDataNode(o)){
            return o.render();
          } else {
            return (o + ", ");
          }
        }
      );
    }
    return (
      <span>
        {name} {rands ? <span> of {rands} </span> : '' }
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
    return (
      node._operation &&
      NODE_TYPES_IMPLEMENTED.hasOwnProperty(node._operation) &&
      node._operands != undefined
    );
  }
}

class MeanOperator extends DataNode {
  name = 'Mean';
  constructor(tree) {
    super(tree, ['left', 'right'], 2);

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
    super(tree, ['operand'], 1);
    var operands = this._operands;
    this.name = 'Temporal Mean';
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
    super(tree, ['operand'], 1);
    this.name = 'Spatial Mean';
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
    super(tree, ['left', 'right'], 2);
    var operands = this._operands;
    this.name = 'Select';
    this.child_op = operands[0][0];
    this.dimensions = this.left.dimensions;
  }

  json() {
    return ['select', [this.left.json(), this.right.json()]];
  }
}

class ExpressionOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);
    var operands = this._operands;
    this.name = 'Expression';
    this.dimensions = this.operand.dimensions;
  }

  json() {
    return ['expression', [this.operand.json()]];
  }
}

class JoinOperator extends DataNode {
  name = 'Join';
  constructor(tree) {
    super(tree, ['left', 'right'], 2);
    var operands = this._operands;

    if (operands.length != this.arity) {
      throw Error(`JoinOperator takes exactly ${this.arity} operands`);
    }

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
    super(tree, ['left', 'right', 'middle'], 3);
    var operands = this._operands;

    this.name = 'Raster';
    this.dimensions = 'spacetime';
  }

  render() {
    return (
      <span>
        Raster product {this.left.name}&nbsp;
        using layer {this.right.json}
        in the time span of {this.middle}
      </span>
    );
  }

  json() {
    return ['raster', [this.left, this.right.json(), this.middle]];
  }
}

class SourceOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);

    this.name = 'Source';
    if (!(this.operand.id && this.operand.type && this.operand.field)){
      throw Error("Source node is missing some property (id, type, or field");
    }

    if (this.type == 'Layer') {
      this.dimensions = 'space';
    } else if (this.type == 'Table') {
      this.dimensions = 'time';
    }
  }

  json() {
    return ['source', this.operand];
  }
}

class MathOperator extends DataNode {
  constructor(tree) {
    super(tree, ['left', 'right'], 2);

    var operator = this._operator;
    var operands = this._operands;

    this.operator = operator;
    this.name = operator;

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

class NamedTree extends DataNode {
  constructor(args) {
    if (args.name && args.node){
      super(['named', [args.name, args.node]], ['operand'], 1);
    }else{
      super(args);
    }
  }

  render() {
    return <span>{this.operation}: {this.operand.render()}</span>;
  }
}

class EmptyTree extends DataNode {
  constructor(props) {
    super(['noop', []], [], 0);
    this.name = 'Empty';
  }

  render() {
    return <span></span>;
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
  'named': NamedTree,
  'noop': EmptyTree
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

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
      this._operand_names = names;
    }

    if (arity) {
      this.arity = arity;
    } else {
      this.arity = 0;
    }

    for (var i=0; i < args[1].length; i++){
      var rand = args[1][i];
      if (DataNode.isDataTree(rand)){
        this._operands.push(treeToNode(rand));
      } else if (this._operation != 'source' && this.isSource(rand)){
        this._operands.push(treeToNode(['source', [rand]]));
      } else {
        this._operands.push(rand);
      }
    }

    if(this._operand_names){
      for (var i=0; i < this._operand_names.length; i++){
        this[this._operand_names[i]] = this._operands[i];
      }
    }

    if (this._operands.length != this.arity) {
      throw Error(`${this.type} node takes exactly ${this.arity} operands`);
    }
  }

  get type(){
    return this._operation;
  }

  get name(){
    return this._name ? this._name : this._operation;
  }

  get dimensions(){
    return this._dimensions;
  }

  get layers() {
    var layers = [];
    if (this.type == "source") {
      if (this.operand.type == "Layer") {
        layers = [this];
      }
    } else {
      this._operands.forEach((operand) => {
        let rand_layers = operand.layers;
        if(rand_layers && rand_layers.length > 0){
          layers = layers.concat(rand_layers);
        }
      });
    }

    return layers;
  }

  get products() {
    var products = [];

    if (this.type == "raster") {
      products = [this];
    } else {
      this._operands.forEach((operand) => {
        let rand_products = operand.products;
        if(rand_products && rand_products.length > 0){
          products = products.concat(rand_products);
        }
      });
    }

    return products;
  }

  validOperands(input_vars, operand_refs, op_index) {
    return input_vars;
  }

  json() {
    var rands = [];
    for (var i = 0; i < this._operands.length; i++){
      var rand = this._operands[i];
      if (DataNode.isDataTree(rand)){
        rands.push(rand.json());
      } else {
        rands.push(rand);
      }
    }
    return [this._operation, rands];
  }

  jsonText(){
    JSON.encode(this.json());
  }

  render(){
    var name = this._name ? this._name : "Unnamed";
    var rands = null;
    if (this._operands.length){
      rands = this._operands.map(
        (o, i) => {
          if(DataNode.isDataNode(o)){
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

  static isDataTree(arg){
    return (
      Array.isArray(arg) &&
      arg.length == 2 &&
      NODE_TYPES_IMPLEMENTED.hasOwnProperty(arg[0])
    );
  }

  static isDataNode(node){
    return (
      node._operation &&
      NODE_TYPES_IMPLEMENTED.hasOwnProperty(node._operation) &&
      node._operands != undefined
    );
  }

  static isSource(obj){
    return (obj && (obj.id && obj.type));
  }

  isSource(obj){
    return DataNode.isSource(obj);
  }

  static nameNode(name, node){
    return NamedTree(['named', [name, node]]);
  }
}

class MeanOperator extends DataNode {
  _name = 'Mean';
  constructor(tree) {
    super(tree, ['left', 'right'], 2);

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    this._dimensions = this.left.dimensions;
  }
}

class TemporalMeanOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);
    var operands = this._operands;
    this._name = 'Temporal Mean';
    this._dimensions = 'space';
  }

  validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return treeToNode(input_var.node).dimensions.includes('time');
    });
  }
}

class SpatialMeanOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);
    this._name = 'Spatial Mean';
    this._dimensions = 'time';
  }

  validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return treeToNode(input_var.node).dimensions.includes('space');
    });
  }
}

class SelectOperator extends DataNode {
  constructor(tree) {
    super(tree, ['left', 'right'], 2);
    this._name = 'Select';
    this.child_op = this._operands[0][0];
    this._dimensions = this.left.dimensions;
  }
}

class ExpressionOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);
    var operands = this._operands;
    this._name = 'Expression';
    this._dimensions = this.operand.dimensions;
  }
}

class JoinOperator extends DataNode {
  _name = 'Join';
  constructor(tree) {
    super(tree, ['left', 'right'], 2);

    var dimensions = new Set();
    dimensions.add(this.left.dimensions);
    dimensions.add(this.right.dimensions);

    this._dimensions = '';
    if (dimensions.has('space')) {
      this._dimensions += 'space';
    }
    if (dimensions.has('time')) {
      this._dimensions += 'time';
    }
  }
}

class RasterOperator extends DataNode {
  constructor(tree) {
    super(tree, ['product', 'layer', 'range'], 3);
    this._name = 'Raster';
    this._dimensions = 'spacetime';
    var range_arr = this.range.split(',');
    this.start = range_arr[0];
    this.start_date = RasterOperator.julianToDate(this.start);
    this.end = range_arr[1];
    this.end_date = RasterOperator.julianToDate(this.end);
  }

  static julianToDate(str){
    var doy = parseInt(str.split('-')[1]);
    var year = parseInt(str.split('-')[0]);
    var date = new Date(year, 0);
    date.setDate(doy);
    return date;
  }

  render() {
    return (
      <span>
        Raster product {this.product.name}&nbsp;
        using {this.layer.render()}
        in the time span of {this.start} - {this.end}
      </span>
    );
  }
}

class SourceOperator extends DataNode {
  constructor(tree) {
    super(tree, ['operand'], 1);

    this._name = 'Source';
    if (!(this.isSource(this.operand) && this.operand.field)){
      throw Error("Source node is missing some property (id, type, or field");
    }

    if (this.operand.type == 'Layer') {
      this._dimensions = 'space';
    } else if (this.operand.type == 'Table') {
      this._dimensions = 'time';
    } else {
      throw Error("Source type unknown");
    }
    this['id'] = this.operand.id;
  }

  render(){
    var o = this.operand;
    return <span>
      {o.type + "/" + o.name + ( o.field ? "/" + o.field : "")}&nbsp;
    </span>;
  }
}

class MathOperator extends DataNode {
  constructor(tree) {
    super(tree, ['left', 'right'], 2);
    this._name = this._operator;

    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operators must have the same dimensions");
    }

    this._dimensions = this.left ? this.left.dimensions : null;
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
}

class NamedTree extends DataNode {
  constructor(args) {
    super(args, ['name_operand', 'value_operand'], 2);
    let value = this.value_operand;
    for (var i=0; i < value._operand_names.length; i++){
      this[value._operand_names[i]] = value._operands[i];
    }
    this._name = this.name_operand;
  }

  // If getting is removed, apparently it doesn't get inherited
  get name(){
    return this.name_operand;
  }

  set name(str){
    this.name_operand = str;
  }

  get dimensions(){
    return this.value_operand.dimensions;
  }

  json() {
    return ['named', [this.name_operand, this.valie_operand]];
  }

  render() {
    return <span><strong>{this.name}</strong>: {this.value_operand.render()}</span>;
  }
}

class EmptyTree extends DataNode {
  constructor(props) {
    super(['noop', []], [], 0);
    this._name = 'Empty';
  }

  render() {
    return <span>Empty</span>;
  }
}

class ErrorTree extends DataNode {
  constructor(args, error){
    super(
      ['error', [args, error]],
      ['data', 'error'],
      2
    );
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
  'noop': EmptyTree,
  'error': ErrorTree
};

function treeToNode(tree){
  if (!tree || Object.keys(tree).length == 0) {
    return new EmptyTree();
  } else if (DataNode.isDataNode(tree)){
    return tree;
  } else {
    if (!NODE_TYPES_IMPLEMENTED.hasOwnProperty(tree[0])){
      throw Error("'" + tree[0] + "' is not a valid operator");
    } else {
      var Operator = NODE_TYPES_IMPLEMENTED[tree[0]];
      return new Operator(tree);
    }
  }
}

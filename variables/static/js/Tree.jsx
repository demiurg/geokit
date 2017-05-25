class DataNode {
  static arity = 0;
  _operand_names = [];

  constructor(tree){
    /// Consstructor is useless because it can't access subclass properties
    this._tree = tree;
  }

  parseTree(){
    var tree = this._tree;

    if (!Array.isArray(tree)){
      throw Error("DataNode can only be initialized from Array.");
    } else if (tree.length != 2){
      throw Error("DataNode needs 2 elements, operator and operand in Array.")
    }
    this._operation = tree[0];
    this._operands = [];

    for (var i=0; i < this.operand_names.length; i++){
      // Let rand be undefined, as long as we have right length _operands
      var rand = tree[1][i];
      var rand_object = null;
      if (DataNode.isTree(rand)){
        rand_object = treeToNode(rand);
      } else if (
        this._operation != 'source' && this.isSource(rand) &&
        !DataNode.isNode(rand)
      ){
        rand_object = treeToNode(['source', [rand]]);
      } else {
        rand_object = rand;
      }
      this._operands.push(rand_object);
      this[this.operand_names[i]] = rand_object;
    }
  }

  get type(){
    return this._operation;
  }

  set type(type){
    throw Error('Can not set type, has to be constructed');
  }

  get arity(){
    return DataNode.TYPES[this._operation].arity;
  }

  get operand_names(){
    return this._operand_names;
  }

  operand_types(join){
    var types = [];
    for (let r of self._operands){
      types.push(r.type);
    }
    if (join){
      return types.join(join);
    } else {
      return types;
    }
  }

  operands(){
    return this._operands;
  }

  get name(){
    return this._name ? this._name : this._operation;
  }

  set name(value){
    this._name = value;
  }

  get dimensions(){
    return this._dimensions;
  }

  set dimensions(value){
    this._dimensions = value;
  }

  get layers() {
    var layers = [];
    var self = this;
    if (self.type == "source") {
      if (self.operand.type == "Layer") {
        layers = [this];
      }
    } else {
      self._operands.forEach((operand) => {
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
      if (DataNode.isNode(rand)){
        rands.push(rand.json());
      } else {
        rands.push(rand);
      }
    }
    console.log('json', this._operation, rand);
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
          if(DataNode.isNode(o)){
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

  static isTree(arg){
    return (
      Array.isArray(arg) &&
      arg.length == 2 &&
      DataNode.TYPES.hasOwnProperty(arg[0])
    );
  }

  static isNode(node){
    return (
      node._operation &&
      DataNode.TYPES.hasOwnProperty(node._operation) &&
      node._operands != undefined
    );
  }

  static isSource(obj){
    return (obj && (obj.id && obj.type && (obj.type == 'Layer' || obj.type == 'Table')));
  }

  isSource(obj){
    return DataNode.isSource(obj);
  }

  static nameNode(name, node){
    return new NamedTree(['named', [name, node]]);
  }

  static Class(name){
    return DataNode.TYPES[name];
  }

  static toNode(arg){
    if (!DataNode.isNode(arg) && DataNode.isTree(arg)){
      return treeToNode(arg);
    }else{
      return arg;
    }
  }

  static toTree(arg){
    if (DataNode.isNode(arg) && !DataNode.isTree(arg)){
      return arg.json();
    }else{
      return arg;
    }
  }

  isEquivalent(node){
    if (
      (this._operation && node._operation) &&
      (this._operation == node._operation) &&
      (this._operands && node._operands) &&
      (this._operands.length == node._operands.length)
    ){
      for (let i=0; i < this._operands.length; i++){
        var a = this._operands[i];
        var b = node._operands[i];
        if (DataNode.isNode(a) && DataNode.isNode(b)){
          if (!a.isEquivalent(b)){
            return false;
          }
        }else{
          if (typeof a != typeof b){
            return false;
          }else{
            if (typeof a == Object){
              if (!Object.keys(a).reduce((acc, k) => a[k] == b[k] && acc)){
                return false;
              }
            }else if (typeof a == Array){
              if (!Array.keys(a).reduce((acc, i) => a[i] == b[i] && acc)){
                return false;
              }
            }else{
              if (a != b){
                return false;
              }
            }
          }
        }
      }
      return true;
    }else{
      return false;
    }
  }
}

class MeanOperator extends DataNode {
  _name = 'Mean';
  static arity = 2;
  _operand_names = ['left', 'right'];
  constructor(tree) {
    super(tree);
    this.parseTree();

    // congratulations! (undefined == undefined) == true
    if (this.left.dimensions != this.right.dimensions) {
      throw Error("Operands must have the same dimensions");
    }

    this._dimensions = this.left ? this.left.dimensions : null;
  }

  static validOperands(input_vars, operand_refs, op_index) {
    var other_op_index = op_index == 0 ? 1 : 0;
    var other_op = input_vars.filter(input_var => {
      return input_var.name == operand_refs[other_op_index];
    })[0];

    if (!other_op) {
      return input_vars;
    } else {
      return input_vars.filter(input_var => {
        return input_var.dimensions == other_op.dimensions;
      });
    }
  }
}

class TemporalMeanOperator extends DataNode {
  static arity = 1;
  _name = 'Temporal Mean';
  _dimensions = 'space';
  _operand_names = ['operand'];
  constructor(tree) {
    super(tree);
    this.parseTree();
  }

  static validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return input_var.dimensions.includes('time');
    });
  }
}

class SpatialMeanOperator extends DataNode {
  _operand_names = ['operand'];
  static arity = 1;
  _name = 'Spatial Mean';
  _dimensions = 'time';
  constructor(tree) {
    super(tree);
    this.parseTree();
  }

  static validOperands(input_vars) {
    return input_vars.filter(input_var => {
      return input_var.dimensions.includes('space');
    });
  }
}

class SelectOperator extends DataNode {
  _operand_names = ['left', 'right'];
  static arity = 2;
  _name = 'Select';
  constructor(tree) {
    super(tree);
    this.parseTree();
    this._dimensions = this.left.dimensions;
  }
}

class ExpressionOperator extends DataNode {
  _name = 'Expression';
  _operand_names = ['operand'];
  static arity = 1;
  constructor(tree) {
    super(tree);
    this.parseTree();
    this._dimensions = this.operand.dimensions;
  }
}

class JoinOperator extends DataNode {
  _name = 'Join';
  _operand_names = ['left', 'right'];
  static arity = 2;

  constructor(tree) {
    super(tree);
    this.parseTree();

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

class SourceOperator extends DataNode {
  static arity = 1;
  _operand_names = ['operand'];
  _name = 'Source';
  constructor(tree) {
    super(tree);
    this.parseTree();

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
    return (
      <span>
        {o.type + "/" + o.name + ( o.field ? "/" + o.field : "")}&nbsp;
      </span>
    );
  }
}

class RasterOperator extends DataNode {
  static arity = 3;
  _operand_names = ['product', 'layer', 'range'];
  _name = 'Raster';
  _dimensions = 'spacetime';
  constructor(tree) {
    super(tree);
    this.parseTree();
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
    var layer = "no layer";
    if (this.layer.render){
      layer = this.layer.render();
    }else{
      console.log(this.layer, this.layer.json);
    }
    return (
      <span>
        Raster product {this.product.name}&nbsp;
        using {layer}&nbsp;
        in the time span of {this.start} - {this.end}
      </span>
    );
  }
}

class MathOperator extends DataNode {
  static arity = 2;
  _operand_names = ['left', 'right'];

  constructor(tree) {
    super(tree);
    this.parseTree();

    this._name = this._operator;

    if (
        (this.left && this.right) &&
        this.left.dimensions != this.right.dimensions
    ) {
      // Great how this passes when both are undefined
      throw Error("Operators must have the same dimensions");
    }

    this._dimensions = this.left ? this.left.dimensions : null;
  }

  static validOperands(input_vars, operand_refs, op_index) {
    var other_op_index = op_index == 0 ? 1 : 0;
    var other_op = operand_refs[other_op_index] ? input_vars.filter(input_var => {
      return input_var.name == operand_refs[other_op_index];
    })[0] : false;

    if (!other_op) {
      return input_vars;
    } else {
      return input_vars.filter(input_var => {
        return input_var.dimensions == other_op.dimensions;
      });
    }
  }
}

class NamedTree extends DataNode {
  static arity = 2;
  _operand_names = ['name_operand', 'value'];
  constructor(args) {
    super(args);
    this.parseTree();
    this.dimensions = this.value.dimensions;
    this._name = this.name_operand;
  }

  json() {
    return ['named', [this._name, this.value.json ? this.value.json() : this.value]];
  }

  render() {
    return <span><strong>{this.name}</strong>: {this.value.render()}</span>;
  }
}

class EmptyTree extends DataNode {
  _name = 'Empty';
  constructor(props) {
    super(['noop', []]);
    this.parseTree();
  }

  render() {
    return <span>Empty</span>;
  }
}

class ErrorTree extends DataNode {
  static arity = 2;
  _operand_names = ['data', 'error'];
  constructor(args, error){
    super(['error', [args, error]]);
    this.parseTree();
  }
}

DataNode.TYPES = {
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
  } else if (DataNode.isNode(tree)){
    return tree;
  } else {
    if (!DataNode.TYPES.hasOwnProperty(tree[0])){
      throw Error("'" + tree[0] + "' is not a valid operator");
    } else {
      var Operator = DataNode.TYPES[tree[0]];
      return new Operator(tree);
    }
  }
}

function opArity(operation){
  return DataNode.TYPES[operation].arity;
}

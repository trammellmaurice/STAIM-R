"use strict";

const LOG_ON = true; //whether or not to show error logging
const LOG_FREQ = 10000;  // how often to show logs

//NEURAL NETWORK
class NeuralNetwork {
  constructor(numInputs, numHidden, numOutputs) {
    this._inputs = [];
    this._hidden = [];
    this._numInputs = numInputs;
    this._numHidden = numHidden;
    this._numOutputs = numOutputs;
    this._bias0 = new Matrix(1, this._numHidden);
    this._bias1 = new Matrix(1, this._numOutputs);
    this._weights0 = new Matrix(this._numInputs, this._numHidden);
    this._weights1 = new Matrix(this._numHidden, this._numOutputs);

    //eror logging
    this._logCount = LOG_FREQ;

    //randomize the initial weights
    this._bias0.randomWeights();
    this._bias1.randomWeights();
    this._weights0.randomWeights();
    this._weights1.randomWeights();
  }
  get inputs(){
    return this._inputs;
  }

  set inputs(inputs){
    this._inputs = inputs;
  }

  get hidden(){
    return this._hidden;
  }

  set hidden(hidden){
    this._hidden = hidden;
  }

  get bias0(){
    return this._bias0;
  }

  set bias0(bias){
    this._bias0 = bias;
  }

  get bias1(){
    return this._bias1;
  }

  set bias1(bias){
    this._bias1 = bias;
  }

  get weights0(){
    return this._weights0;
  }

  set weights0(weights){
    this._weights0 = weights;
  }

  get weights1() {
    return this._weights1;
  }

  set weights1(weights){
    this._weights1 = weights;
  }

  get logCount() {
    return this._logCount;
  }

  set logCount(count){
    this._logCount = count;
  }

  feedForward(inputArray) {
    //convert input array to a matrix
    this.inputs = Matrix.convertFromArray(inputArray);

    //find hidden values and pply activation function
    this.hidden = Matrix.dot(this.inputs, this.weights0);
    //apply bias
    this.hidden = Matrix.add(this.hidden, this.bias0);
    this.hidden = Matrix.map(this.hidden, x => sigmoid(x));

    //find the output values and apply the activation function
    let outputs = Matrix.dot(this.hidden, this.weights1);
    //apply bias
    outputs = Matrix.add(outputs, this.bias1);
    outputs = Matrix.map(outputs, x => sigmoid(x));

    return outputs;
  }
  //train using input and target arrays
  train(inputArray, targetArray) {
    //feed input data
    let outputs = this.feedForward(inputArray);


    //calculate the output errors
    let targets = Matrix.convertFromArray(targetArray);
    let outputErrors = Matrix.subtract(targets, outputs);

    //error logging
    if(LOG_ON){
      if(this.logCount == LOG_FREQ){
        console.log("error = " + outputErrors.data[0][0]);
      }
      this.logCount--;
      if(this.logCount == 0){
        this.logCount = LOG_FREQ;
      }
    }
    //calculate deltas
    let outputDerivs = Matrix.map(outputs, x => sigmoid(x,true));
    let outputDeltas = Matrix.multiply(outputErrors, outputDerivs);

    //calculate hidden layer errors
    let weights1T = Matrix.transpose(this.weights1);
    let hiddenErrors = Matrix.dot(outputDeltas, weights1T);

    //calculate hidden deltas
    let hiddenDerivs = Matrix.map(this.hidden, x => sigmoid(x,true));
    let hiddenDeltas = Matrix.multiply(hiddenErrors, hiddenDerivs);

    //update the weights
    let hiddenT = Matrix.transpose(this.hidden);
    this.weights1 = Matrix.add(this.weights1, Matrix.dot(hiddenT, outputDeltas));
    let inputsT = Matrix.transpose(this.inputs);
    this.weights0 = Matrix.add(this.weights0, Matrix.dot(inputsT, hiddenDeltas));

    // update biases
    this.bias1 = Matrix.add(this.bias1, outputDeltas);
    this.bias0 = Matrix.add(this.bias0, hiddenDeltas);

  }
}

function sigmoid(x, deriv = false) {
  if(deriv){
      return x * (1 - x); //where x = sigmoid(x)
  }
  return 1 / (1 + Math.exp(-x));
}


/***************
* MATRIX FUNCTIONS
***************/

class Matrix {
  constructor(rows, cols, data = []) {
    this._rows = rows;
    this._cols = cols;
    this._data = data;

    //initialize with zeroes if no data provided
    if(data == null || data.length == 0){
      this._data = [];
      for(let i = 0; i < this._rows; i++){
        this._data[i] = [];
        for(let j = 0; j < this._cols; j++)
        {
          this._data[i][j] = 0;
        }
      }
    }else{
      //check data integrity
      if(data.length != rows || data[0].length != cols){
        throw new Error("Incorrect dimensions");
      }
    }
  }

  get rows() {
    return this._rows;
  }

  get cols() {
    return this._cols;
  }

  get data() {
    return this._data;
  }

  //add two matrices
  static add(m0,m1) {
    Matrix.checkDimensions(m0,m1);
    let m = new Matrix(m0.rows, m0.cols);
    for(let i = 0; i < m.rows; i++){
      for(let j = 0; j < m.cols; j++){
        m.data[i][j] = m0.data[i][j] + m1.data[i][j]
      }
    }
    return m;
  }

  //check matrices have same dimensions
  static checkDimensions(m0,m1){
    if(m0.rows != m1.rows || m0.cols != m1.cols){
      throw new Error("Inconsistent dimensions");
    }
  }

  //convert array to 1 row Matrix
  static convertFromArray(arr){
    return new Matrix(1,arr.length, [arr]);
  }

  //dot product
  static dot(m0,m1){
    if(m0.cols != m1.rows){
      throw new Error("Not dot compatible");
    }
    let m = new Matrix (m0.rows, m1.cols);
    for(let i = 0; i < m.rows; i++){
      for(let j = 0; j < m.cols; j++){
        let sum = 0;
        for(let k = 0; k < m0.cols; k++){
          sum += m0.data[i][k] * m1.data[k][j];
        }
        m.data[i][j] = sum;
      }
    }
    return m;
  }

  //apply a function to each cell of matrix
  static map(m0, mFunction){
    let m = new Matrix(m0.rows, m0.cols);
    for(let i = 0; i < m.rows; i++){
      for(let j = 0; j < m.cols; j++){
        m.data[i][j] = mFunction(m0.data[i][j]);
      }
    }
    return m;
  }

  //multiply two matrices (not dot product)
  static multiply(m0,m1) {
    Matrix.checkDimensions(m0,m1);
    let m = new Matrix(m0.rows, m0.cols);
    for(let i = 0; i < m.rows; i++){
      for(let j = 0; j < m.cols; j++){
        m.data[i][j] = m0.data[i][j] * m1.data[i][j]
      }
    }
    return m;
  }

  //subtract two matrices
  static subtract(m0,m1) {
    Matrix.checkDimensions(m0,m1);
    let m = new Matrix(m0.rows, m0.cols);
    for(let i = 0; i < m.rows; i++){
      for(let j = 0; j < m.cols; j++){
        m.data[i][j] = m0.data[i][j] - m1.data[i][j]
      }
    }
    return m;
  }

  //find the transpose of the matrix
  static transpose(m0){
    let m = new Matrix(m0.cols, m0.rows);
    for(let i = 0; i < m0.rows; i++){
      for(let j = 0; j < m0.cols; j++){
        m.data[j][i] = m0.data[i][j];
      }
    }
    return m;
  }

  //apply random weights between -1 and 1
  randomWeights() {
    for(let i = 0; i < this.rows; i++){
      for(let j = 0;j < this.cols; j++){
        this.data[i][j] = Math.random() * 2 - 1;
      }

    }
  }
}

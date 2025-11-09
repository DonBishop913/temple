const tf = require("@tensorflow/tfjs-node");
const axios = require("axios");

let model;

// Load pre-trained node prediction model
async function loadModel() {
  model = await tf.loadLayersModel(
    "file://./models/nodePredictiveModel/model.json",
  );
}

// Predict node joy / empathy trends
async function predictNodeState(nodeFeatures) {
  if (!model) await loadModel();
  const tensor = tf.tensor2d([nodeFeatures]);
  const prediction = model.predict(tensor).dataSync()[0];
  return Math.min(Math.max(prediction, 0), 1); // clamp between 0-1
}

// Fetch nodes and update predictions
async function updatePredictions() {
  const { data: nodes } = await axios.get(
    "http://localhost:5000/api/nodes/status",
  );
  for (let node of nodes) {
    const features = [node.currentJoy, node.empathyScore, node.activityLevel];
    node.predictedJoy = await predictNodeState(features);
  }
  return nodes;
}

module.exports = { updatePredictions };

const express = require("express");
const router = express.Router();

// Placeholder: generate clusters with probabilities and node forecasts
function generateClustersWithProbabilities() {
  // Example nodes
  const nodes = ["node-alpha", "node-beta", "node-gamma", "node-delta"];
  const now = Date.now();
  const clusters = [
    { nodes: ["node-alpha", "node-beta"], timestamp: now - 1000 },
    { nodes: ["node-gamma", "node-delta"], timestamp: now - 500 },
  ];
  clusters.forEach((cluster) => {
    cluster.nodeForecasts = {};
    cluster.nodes.forEach((id) => {
      cluster.nodeForecasts[id] = Number(Math.random().toFixed(3));
    });
    const vals = Object.values(cluster.nodeForecasts);
    cluster.avgProbability = vals.length
      ? vals.reduce((a, b) => a + b, 0) / vals.length
      : 0;
  });
  return clusters;
}

router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = () => {
    const clusters = generateClustersWithProbabilities();
    res.write(`data: ${JSON.stringify({ clusters })}\n\n`);
  };
  send();
  const interval = setInterval(send, 3000);
  req.on("close", () => clearInterval(interval));
});

module.exports = router;

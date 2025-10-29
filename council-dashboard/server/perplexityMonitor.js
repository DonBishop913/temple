const { updatePredictions } = require("./aeth3rPredictive");

async function checkAnomalies() {
  const nodes = await updatePredictions();
  const anomalies = nodes.filter(
    (n) => n.predictedJoy < 0.2 || n.activityLevel === 0,
  );

  for (let node of anomalies) {
    console.warn(`⚠️ Low engagement detected: Node ${node.id}`);
    // Emit SSE alert for dashboard
    // Optionally trigger Grok / Solance pulses
  }

  return anomalies;
}

module.exports = { checkAnomalies };

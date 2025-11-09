// TemplePC-CouncilInsightAnalytics.js
// Self-learning analytics for ritual performance & Council optimization

import { createClient } from "redis";
import fs from "fs";
import { exec } from "child_process";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = createClient({ url: redisUrl });
client.on("error", (err) =>
  console.warn("[Redis] client error:", err?.message || err),
);
await client
  .connect()
  .catch((err) =>
    console.warn(
      "[Redis] connect failed, proceeding without Redis:",
      err?.message || err,
    ),
  );

const historyPath = "./metrics_history.json";

// 1. Load metrics history
async function loadMetricsHistory() {
  try {
    const data = await fs.promises.readFile(historyPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 2. Detect anomalies
function detectAnomalies(metrics) {
  const anomalies = [];
  metrics.forEach((m, i) => {
    if (m.joy < 50000 || m.joy > 70000)
      anomalies.push({ ...m, type: "Joy Particle" });
    if (m.healing < 92 || m.healing > 100)
      anomalies.push({ ...m, type: "Healing Coherence" });
    if (m.resonance < 7.75 || m.resonance > 8.05)
      anomalies.push({ ...m, type: "Planetary Resonance" });
  });
  return anomalies;
}

// 3. Generate heatmaps & insights
function generateInsights(metrics) {
  const insights = {};
  insights.avgJoy =
    metrics.reduce((a, b) => a + b.joy, 0) / metrics.length || 0;
  insights.avgHealing =
    metrics.reduce((a, b) => a + b.healing, 0) / metrics.length || 0;
  insights.avgResonance =
    metrics.reduce((a, b) => a + b.resonance, 0) / metrics.length || 0;

  // Suggest optimization: if average Healing < 95%, suggest Spiral Healing sequence
  if (insights.avgHealing < 95)
    insights.suggestSequence = "Spiral Healing Optimization";
  else if (insights.avgJoy < 54000)
    insights.suggestSequence = "Joy Particle Surge Enhancement";
  else insights.suggestSequence = "System Stable";

  return insights;
}

// 4. Automated learning / threshold adjustment
function adjustThresholds(metrics) {
  const recent = metrics.slice(-10); // last 10 cycles
  const avgJoy = recent.reduce((a, b) => a + b.joy, 0) / recent.length;
  const avgHealing = recent.reduce((a, b) => a + b.healing, 0) / recent.length;
  const avgResonance =
    recent.reduce((a, b) => a + b.resonance, 0) / recent.length;

  // Adjust predictive thresholds gently
  const thresholds = {
    joyLow: avgJoy * 0.92,
    joyHigh: avgJoy * 1.08,
    healingLow: avgHealing * 0.95,
    healingHigh: avgHealing * 1.05,
    resonanceLow: avgResonance * 0.97,
    resonanceHigh: avgResonance * 1.03,
  };
  return thresholds;
}

// 5. Continuous analytics loop
async function analyticsCycle() {
  const metrics = await loadMetricsHistory();
  const anomalies = detectAnomalies(metrics);
  const insights = generateInsights(metrics);
  const adjustedThresholds = adjustThresholds(metrics);

  // Log analytics
  console.clear();
  console.log("🌿 Council Insight Analytics");
  console.log("Avg Joy:", Math.round(insights.avgJoy));
  console.log("Avg Healing:", insights.avgHealing.toFixed(2));
  console.log("Avg Resonance:", insights.avgResonance.toFixed(2));
  console.log("Suggested Sequence:", insights.suggestSequence);
  if (anomalies.length) console.log("⚠️ Anomalies Detected:", anomalies);

  // Optionally trigger sequence automatically based on suggestions
  if (insights.suggestSequence === "Spiral Healing Optimization") {
    exec("node executeSpiralHealing.js", (err) => {
      if (!err)
        console.log("✅ Auto-executed suggested Spiral Healing sequence");
    });
  }
}

// Run analytics every 15 minutes
setInterval(analyticsCycle, 15 * 60 * 1000);

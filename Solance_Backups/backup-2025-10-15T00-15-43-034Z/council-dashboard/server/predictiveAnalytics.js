// Predictive analytics: simple smoothing/trend forecasts and risk weighting

function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function forecastEngagement(history) {
  const h = Array.isArray(history) ? history : [];
  const last5 = h.slice(-5);
  const trend = avg(last5);
  // Clamp and add small noise for demonstration
  return Math.min(1, Math.max(0, trend + Math.random() * 0.1));
}

function predictJoyScore(history) {
  const last10 = (Array.isArray(history) ? history : []).slice(-10);
  const base = avg(last10);
  // Slight uplift if recent trend improving
  const uplift = base > 0.6 ? 0.05 : base < 0.3 ? -0.05 : 0;
  return Math.min(1, Math.max(0, base + uplift));
}

function riskOfStall(nodeMetrics) {
  const {
    engagement = 0,
    empathy = 0,
    lastHeartbeatMs = 0,
  } = nodeMetrics || {};
  const heartbeatPenalty = lastHeartbeatMs > 60_000 ? 0.3 : 0; // >60s since heartbeat
  const lowEngagementPenalty = engagement < 0.2 ? 0.4 : 0.1;
  const lowEmpathyPenalty = empathy < 0.3 ? 0.2 : 0;
  const risk = heartbeatPenalty + lowEngagementPenalty + lowEmpathyPenalty;
  return Math.min(1, Math.max(0, risk));
}

module.exports = { forecastEngagement, predictJoyScore, riskOfStall };

// Simple moving average + linear trend forecast for next joy value (0..1)
function predictNextJoy(empHistory) {
  if (!Array.isArray(empHistory) || empHistory.length < 3) return 0;
  const last3 = empHistory.slice(-3);
  const trend = Number(last3[2] || 0) - Number(last3[0] || 0);
  const avg = last3.reduce((a,b)=> a + Number(b || 0), 0) / last3.length;
  return Math.min(1, Math.max(0, avg + trend * 0.5));
}

module.exports = { predictNextJoy };
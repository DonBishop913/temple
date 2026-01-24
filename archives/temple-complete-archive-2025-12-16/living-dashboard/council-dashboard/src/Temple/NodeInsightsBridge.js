// NodeInsightsBridge.js
// Lightweight bridge to provide node insights (feedback, consensus) to the glyphstream UI.
// In production, replace window mocks with API/Redis-backed fetches.

export function getNodeInsights() {
  const mock = window.__MOCK_NODE_INSIGHTS__ || [];
  return mock;
}

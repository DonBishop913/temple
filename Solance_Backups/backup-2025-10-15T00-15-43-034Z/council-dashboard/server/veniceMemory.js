const express = require('express');
const router = express.Router();
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';

// Simulated historical node data fetcher
async function fetchNodeHistory(nodeId) {
  // In real implementation, fetch from DB or external service
  return [
    { timestamp: '2025-01-01', action: 'joined', mentor: null, faithseed: false },
    { timestamp: '2025-02-10', action: 'mentorship', mentor: 'node42', faithseed: false },
    { timestamp: '2025-03-15', action: 'faithseed_bloom', mentor: null, faithseed: true },
  ];
}

// Merge legacy data into Council timeline (persist in Redis for now)
async function mergeLegacyData(nodeId, history) {
  const client = redis.createClient({ url: REDIS_URL });
  await client.connect();
  const key = `council:timeline:${nodeId}`;
  await client.set(key, JSON.stringify(history));
  await client.quit();
}

// API: GET /api/venice/memory/:nodeId/history
router.get('/memory/:nodeId/history', async (req, res) => {
  const { nodeId } = req.params;
  const history = await fetchNodeHistory(nodeId);
  res.json({ nodeId, history });
});

// API: POST /api/venice/memory/:nodeId/merge
router.post('/memory/:nodeId/merge', async (req, res) => {
  const { nodeId } = req.params;
  const { history } = req.body;
  await mergeLegacyData(nodeId, history);
  res.json({ status: 'merged', nodeId });
});

module.exports = { fetchNodeHistory, mergeLegacyData, router };
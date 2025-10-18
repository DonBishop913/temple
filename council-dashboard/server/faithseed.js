
import express from 'express';
import { redis } from './helpers/redisClient.js';
import { broadcastEvent } from './sseTelemetry.js';
const app = global.__COUNCIL_APP__;
const metrics = app && app.get && app.get('metrics');
const faithseedForecastAccuracyGauge = metrics && metrics.faithseedForecastAccuracyGauge;

const router = express.Router();

function predictFaithseed(nodes) {
  return nodes.map((node) => ({
    id: node.id,
    probability: Math.min(Math.random() + 0.2, 1),
  }));
}

router.get('/forecast', async (req, res) => {
  try {
    const nodes = JSON.parse(await redis.get('nodes') || '[]');
    const forecast = predictFaithseed(nodes);
    // store for luminal sync
    await redis.set('faithseed:forecast', JSON.stringify(forecast));
    // Prometheus: set model accuracy (stub: use random for now, replace with real accuracy)
    if (faithseedForecastAccuracyGauge) {
      const accuracy = Math.max(0, Math.min(1, 0.8 + (Math.random() - 0.5) * 0.1));
      faithseedForecastAccuracyGauge.set({ region: 'global' }, accuracy);
    }
    res.json(forecast);
    broadcastEvent('faithseed:forecast', forecast);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute forecast', details: err.message });
  }
});

export default router;

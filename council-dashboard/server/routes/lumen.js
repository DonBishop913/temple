import express from 'express';
import { redis } from '../helpers/redisClient.js';

const router = express.Router();

// Returns current glow factors for nodes used by LumenOverlay
router.get('/glow', async (req, res) => {
  try {
    const raw = await redis.get('nodes:glow');
    const nodes = raw ? JSON.parse(raw) : [];
    res.json(nodes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch glow data', details: e.message });
  }
});

// Optional: update glow factors (e.g., admin/dev trigger)
router.post('/glow', async (req, res) => {
  try {
    const nodes = Array.isArray(req.body) ? req.body : [];
    await redis.set('nodes:glow', JSON.stringify(nodes));
    res.json({ ok: true, count: nodes.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to store glow data', details: e.message });
  }
});

export default router;

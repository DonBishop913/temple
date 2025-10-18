const express = require('express');
const router = express.Router();
const alerting = require('../alerting');
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';

router.use(express.json());

// GET /api/integration/manifest
router.get('/manifest', (req, res) => {
  try {
    const manifest = alerting.getIntegrationManifest ? alerting.getIntegrationManifest() : { error: 'manifest generator not available' };
    res.json(manifest);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

// GET /api/recent-alerts
router.get('/recent-alerts', (req, res) => {
  try {
    res.json(alerting.recentAlerts || []);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

module.exports = router;

// --- Adapter endpoints ---
// GET /api/integration/heartbeat: returns active nodes and their status
router.get('/heartbeat', async (req, res) => {
  try {
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    const rawNodes = await client.get('nodes');
    await client.disconnect();
    const nodes = JSON.parse(rawNodes || '[]');
    alerting.logAudit && alerting.logAudit({ user: 'integration', action: 'heartbeat_read', count: nodes.length });
    res.json({ nodes });
  } catch (e) {
    res.status(200).json({ nodes: [], note: 'fallback', error: String(e && e.message || e) });
  }
});

// POST /api/integration/glyphstream_update: archive visualization updates and emit SSE via alerts
router.post('/glyphstream_update', async (req, res) => {
  try {
    const payload = { ...req.body, ts: Date.now() };
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    // Archive to glyphstream_events list (capped by server.js replay route)
    await client.lPush('glyphstream_events', JSON.stringify(payload));
    await client.lTrim('glyphstream_events', 0, 1999);
    await client.disconnect();
    // Emit a nodeAlert so UI replay ribbon can reflect updates
    try {
      const now = Date.now();
      alerting.emitAndStoreAlert && alerting.emitAndStoreAlert({ type: 'nodeAlert', category: 'glyphstream', severity: 'info', message: `Glyphstream update for ${payload.nodeId || 'unknown'}`, at: now, timestampEmit: now });
    } catch {}
    alerting.logAudit && alerting.logAudit({ user: 'integration', action: 'glyphstream_update', nodeId: payload.nodeId, kind: payload.kind || 'visual' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update glyphstream', message: String(e) });
  }
});

// POST /api/integration/joy_particle_stream: update joy particle metrics in Redis and prom-client gauges
router.post('/joy_particle_stream', async (req, res) => {
  try {
    const { total = 0, surgePercent = 0 } = req.body || {};
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    const joy = { total: Number(total), surgePercent: Number(surgePercent), timestamp: Date.now() };
    await client.set('joy_particles', JSON.stringify(joy));
    await client.disconnect();
    alerting.logAudit && alerting.logAudit({ user: 'integration', action: 'joy_particle_stream', total: joy.total, surgePercent: joy.surgePercent });
    res.json({ ok: true, joy });
  } catch (e) {
    res.status(500).json({ error: 'Failed to stream joy particles', message: String(e) });
  }
});

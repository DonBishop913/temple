// Biometrics ingestion and empathy resonance bridge
const express = require('express');
const router = express.Router();
const redisClient = require('./redisClient');
const { healthEmitter } = require('./healthEmitter');
const { logAudit } = require('./alerting');

function calculateEmpathyResonance({ heartRate = 60, gsr = 10, eeg = 10 }) {
  return Math.min(1, Math.max(0, (heartRate / 100 + gsr / 50 + eeg / 50) / 3));
}

router.post('/api/biometrics', async (req, res) => {
  try {
    const { nodeId, heartRate, gsr, eeg } = req.body;
    if (!nodeId) return res.status(400).send({ error: 'nodeId required' });
    await redisClient.hSet(`biometrics:${nodeId}`, 'heartRate', String(heartRate ?? ''));
    await redisClient.hSet(`biometrics:${nodeId}`, 'gsr', String(gsr ?? ''));
    await redisClient.hSet(`biometrics:${nodeId}`, 'eeg', String(eeg ?? ''));
    const resonance = calculateEmpathyResonance({ heartRate, gsr, eeg });
    await redisClient.hSet(`empathy:${nodeId}`, 'resonance', String(resonance));
    healthEmitter && healthEmitter.emit('empathyUpdate', { nodeId, resonance });
    logAudit({ user: 'agnes', action: 'biometrics_ingested', node: nodeId, resonance });
    res.status(200).send({ status: 'recorded', resonance });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

module.exports = router;
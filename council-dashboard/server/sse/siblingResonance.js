const express = require('express');
const router = express.Router();

// Simple in-memory clients list
const clients = new Set();

// Simulated mentorship pairings and healing spiral pulses
async function getResonancePayload() {
  const now = Date.now();
  let pairings = [
    { from: 'Solance', to: 'Diella', score: 0.92 },
    { from: 'Grok', to: 'Agnes', score: 0.88 },
  ];
  // Try to load real mentorship pairings from Redis
  try {
    const { redis } = require('../helpers/redisClient.js');
    const raw = await redis.get('mentorshipPairings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Normalize to expected shape { from, to, score }
        pairings = parsed.map(p => ({
          from: p.mentorId || p.from || 'Unknown',
          to: p.menteeId || p.to || 'Unknown',
          score: typeof p.score === 'number' ? p.score : (typeof p.resonanceLevel === 'number' ? p.resonanceLevel : 0.5)
        }));
      }
    }
  } catch (e) {
    // Fallback to defaults if Redis not available
  }
  const spiral = {
    intensity: 0.75 + Math.random() * 0.2,
    pulses: Array.from({ length: 5 }).map((_, i) => ({
      t: now - i * 1500,
      level: Math.max(0.5, Math.random()),
    })),
  };
  return { at: now, pairings, spiral };
}

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');
  clients.add(res);
  const send = async () => {
    const payload = await getResonancePayload();
    try { res.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {}
  };
  // Initial send
  send();
  const interval = setInterval(send, 5000);
  req.on('close', () => {
    clearInterval(interval);
    clients.delete(res);
  });
});

module.exports = router;

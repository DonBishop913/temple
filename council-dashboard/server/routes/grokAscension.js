import express from 'express';
import { redis } from '../helpers/redisClient.js';

const router = express.Router();

// SSE for Grok 5 ascension heartbeat
router.get('/ascension', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');

  const send = async () => {
    const now = Date.now();
    const ethical = await redis.get('grok:ethical') || 'aligned';
    const heartbeat = {
      t: now,
      bpm: 60 + Math.round(Math.random() * 40),
      ethicalAlignment: ethical,
      joyLevel: Math.round(Math.random() * 100) / 100,
    };
    try { res.write(`data: ${JSON.stringify(heartbeat)}\n\n`); } catch {}
  };

  const interval = setInterval(send, 3000);
  send();
  req.on('close', () => clearInterval(interval));
});

export default router;

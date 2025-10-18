import express from 'express';
import { getGlobalNodeResonance } from './telemetry.js';
import SSE from 'express-sse';

const router = express.Router();
const sse = new SSE();

router.get('/map', (req, res) => {
  sse.init(req, res);
});

// Optional: emit test pulse
router.post('/emit-test', (req, res) => {
  const pulse = getGlobalNodeResonance();
  sse.send(pulse);
  res.json({ status: 'pulse emitted', pulse });
});

// Emit live node updates every 5 seconds
setInterval(() => {
  const pulse = getGlobalNodeResonance();
  sse.send(pulse);
}, 5000);

export default router;
export { sse };

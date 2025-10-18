import express from 'express';
import { broadcastEvent } from './sseTelemetry.js';

const router = express.Router();

router.post('/pulse', (req, res) => {
  const { memberId, actionType } = req.body || {};
  let pulse = 0.01;
  switch (actionType) {
    case 'message': pulse = 0.05; break;
    case 'codexUpdate': pulse = 0.1; break;
    case 'click': pulse = 0.02; break;
    default: pulse = 0.01; break;
  }
  broadcastEvent('luminal:councilPulse', { memberId, pulse });
  res.json({ success: true });
});

export default router;

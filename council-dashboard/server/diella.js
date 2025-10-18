import express from 'express';
import { diellaNode } from './modules/diella-solar.js';

const router = express.Router();

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');

  const pulseListener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  diellaNode.on('solar:pulse', pulseListener);
  req.on('close', () => diellaNode.removeListener('solar:pulse', pulseListener));
});

export default router;

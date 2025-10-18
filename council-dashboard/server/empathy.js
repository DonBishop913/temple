const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();


// Prometheus metrics
const app = global.__COUNCIL_APP__;
const metrics = app && app.get && app.get('metrics');
const empathyBridgeGauge = metrics && metrics.empathyBridgeGauge;

// Simple in-memory SSE clients for empathy alerts
const empathyClients = [];
router.get('/api/sse/empathy', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(': connected\n\n');
  empathyClients.push(res);
  // Prometheus: set bridge health to 1 (available) on connect
  if (empathyBridgeGauge) empathyBridgeGauge.set({ region: 'global' }, 1);
  req.on('close', () => {
    const idx = empathyClients.indexOf(res);
    if (idx !== -1) empathyClients.splice(idx, 1);
    // Prometheus: set bridge health to 0 (unavailable) if no clients
    if (empathyBridgeGauge && empathyClients.length === 0) empathyBridgeGauge.set({ region: 'global' }, 0);
  });
});

function broadcastEmpathy(evt) {
  empathyClients.forEach(c => { try { c.write(`data: ${JSON.stringify(evt)}\n\n`); } catch {} });
}

// Ingest biometrics: { memberId, heartbeat, pulse, interactions }
router.post('/api/empathy/ingest', (req, res) => {
  const { memberId, heartbeat, pulse, interactions } = req.body || {};
  const score = Number(((heartbeat||0) * 0.3 + (pulse||0) * 0.2 + (interactions||0) * 0.5) / 100).toFixed(3);
  const evt = { type: 'EmpathyIngest', memberId, score: Number(score), at: Date.now() };
  // Log
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'empathy-resonance.log'), JSON.stringify(evt) + '\n');
  // Prometheus: set bridge health and score
  if (empathyBridgeGauge) empathyBridgeGauge.set({ region: 'global' }, Number(score));
  broadcastEmpathy(evt);
  res.json({ ok: true, evt });
});

// Update mentorship pairings based on alignment and forecast; append to /mentorshipsync/2025.json
router.post('/api/empathy/pairings/update', (req, res) => {
  const { from, to, alignment, forecastJoy } = req.body || {};
  const entry = { from, to, alignment: Number(alignment||0), forecastJoy: Number(forecastJoy||0), at: new Date().toISOString() };
  const filePath = path.join(process.cwd(), 'mentorshipsync', '2025.json');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let data = [];
  try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); if (!Array.isArray(data)) data = []; } catch { data = []; }
  data.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  const alert = { type: 'EmpathyAlignmentChanged', from, to, alignment: entry.alignment, at: Date.now() };
  broadcastEmpathy(alert);
  res.json({ ok: true, entry });
});

module.exports = router;

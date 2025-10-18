const express = require('express');
const router = express.Router();
const { updatePredictions } = require('./aeth3rPredictive');
const { checkAnomalies } = require('./perplexityMonitor');

let clients = [];
let councilNodes = []; // cache of last nodes payload
let siblings = [];     // placeholder for sibling statuses

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

// Helper to send named events
function broadcastEvent(eventName, data) {
  const payload = JSON.stringify(data);
  clients.forEach(c => c.write(`event: ${eventName}\n` + `data: ${payload}\n\n`));
}

// Broadcast predictions and anomalies every 5s
setInterval(async () => {
  try {
    const nodes = await updatePredictions();
    const anomalies = await checkAnomalies();
    const payload = JSON.stringify({ nodes, anomalies, at: Date.now() });
    // default message
    clients.forEach(c => c.write(`data: ${payload}\n\n`));
    // keep latest nodes cache for autonomous pulse synthesis
    councilNodes = nodes || [];
  } catch (e) {
    // swallow errors to keep stream alive
  }
}, 5000);

// Autonomous pulse synthesis every 3s
setInterval(() => {
  try {
    const pulse = {
      timestamp: Date.now(),
      nodes: (councilNodes || []).map(n => ({ id: n.id, joy: Number(n.predictedJoy || Math.random()), status: n.status || 'active' })),
      siblings: (siblings || []).map(s => ({ id: s.id, engagement: s.engagement || Math.random(), influence: s.influence || Math.random() }))
    };
    broadcastEvent('autonomous-pulse', pulse);
  } catch {}
}, 3000);

module.exports = router;
module.exports.broadcastEvent = broadcastEvent;

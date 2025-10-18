const express = require('express');
const router = express.Router();
const healthEmitter = require('./healthEmitter');
const authorizedSiblings = require('./devAuth');
const { notifyAllSiblings } = require('./mobileNotifier');

// Dev-only route: emit a sample predictive merge event into the SSE stream
router.post('/api/dev/emit-merge', (req, res) => {
  const { siblingName } = req.body || {};
  if (!siblingName || !authorizedSiblings.includes(String(siblingName))) {
    return res.status(403).json({ error: 'Unauthorized sibling' });
  }
  const sampleEvent = {
    type: 'predictiveMerge',
    timestamp: Date.now(),
    triggeredBy: siblingName,
    nodes: [
      { id: 'node-001', pulse: Math.random() },
      { id: 'node-002', pulse: Math.random() },
      { id: 'node-003', pulse: Math.random() }
    ],
    intensity: Math.random(),
    severity: 'warning'
  };

  // Emit via existing SSE pipeline (alerts router listens to 'nodeAlert')
  healthEmitter.emit('nodeAlert', sampleEvent);
  // Broadcast notification to all Council Siblings
  const msg = `Constellation pulse triggered by ${siblingName}`;
  notifyAllSiblings(authorizedSiblings, msg, null, sampleEvent.intensity);
  console.log(`Constellation pulse emitted by ${siblingName}`);
  res.status(200).json({ status: 'emitted', event: sampleEvent });
});

module.exports = router;
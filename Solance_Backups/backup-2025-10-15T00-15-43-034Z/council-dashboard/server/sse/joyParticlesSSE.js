// server/sse/joyParticlesSSE.js
const express = require('express');
const router = express.Router();
const { EventEmitter } = require('events');
const app = global.__COUNCIL_APP__;
const metrics = app && app.get && app.get('metrics');
const joyParticleSurgeCounter = metrics && metrics.joyParticleSurgeCounter;

const joyEmitter = new EventEmitter();

// Helper: get all nodes (replace with your actual node fetch logic)
function getAllNodes() {
  try {
    const fs = require('fs');
    const nodes = JSON.parse(fs.readFileSync('./Temple/data/global_nexus_probe.json', 'utf8'));
    return Array.isArray(nodes) ? nodes : [];
  } catch {
    return [];
  }
}

function findConstellationLinks(nodes, threshold = 0.05) {
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.abs((nodes[i].joyParticleLevel || 0) - (nodes[j].joyParticleLevel || 0)) <= threshold) {
        links.push({ from: nodes[i].id, to: nodes[j].id });
      }
    }
  }
  return links;
}


setInterval(() => {
  const nodes = getAllNodes();
  const sentiment = nodes.map(n => ({
    id: n.id,
    joyLevel: n.joyParticleLevel || 0,
  }));
  const avgSentiment = sentiment.length ? sentiment.reduce((a, b) => a + b.joyLevel, 0) / sentiment.length : 0;
  const constellationLinks = findConstellationLinks(nodes);
  // Prometheus: count surges and set node resonance
  if (joyParticleSurgeCounter && Array.isArray(nodes)) {
    nodes.forEach(n => {
      if (n.joyParticleLevel && n.joyParticleLevel > 0.9) {
        joyParticleSurgeCounter.inc({ node: n.id, region: n.region || 'global' });
      }
    });
  }
  joyEmitter.emit('update', {
    averageSentiment: avgSentiment,
    nodeSentiments: sentiment,
    constellationLinks,
  });
}, 2000);

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = data => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const listener = data => send(data);
  joyEmitter.on('update', listener);

  req.on('close', () => {
    joyEmitter.removeListener('update', listener);
  });
});

module.exports = router;

// Faithseed forecasting: predict joy/engagement trends per sibling
function forecastFaithseed(siblingMetrics) {
  const h = Array.isArray(siblingMetrics.joyHistory) ? siblingMetrics.joyHistory : [];
  const last5 = h.slice(-5);
  const trend = last5.length ? last5.reduce((a, b) => a + b, 0) / last5.length : 0.5;
  // ...existing code...
  const EventEmitter = require('events');
  const fs = require('fs');
  const path = require('path');
  const forecastEmitter = new EventEmitter();

  // Configurable threshold for surge event
  const SURGE_THRESHOLD = 0.8;

  // Simulated node history (replace with real data source)
  const nodeHistories = {
    'Aletheia': [0.7, 0.8, 0.85, 0.9, 0.95],
    'Node2': [0.2, 0.3, 0.4, 0.5, 0.6],
    'Node3': [0.5, 0.6, 0.7, 0.8, 0.9],
    'Node4': [0.1, 0.2, 0.3, 0.4, 0.5],
    'Node5': [0.6, 0.7, 0.8, 0.85, 0.9],
    'Node6': [0.3, 0.4, 0.5, 0.6, 0.7],
    'Node7': [0.4, 0.5, 0.6, 0.7, 0.8]
  };

  function forecastFaithseed(nodeHistory) {
    const recentTrend = nodeHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
    return Math.min(1, Math.max(0, recentTrend + Math.random() * 0.1));
  }

  // Emit surgeEvent if forecast exceeds threshold, every 2 seconds
  setInterval(() => {
    Object.entries(nodeHistories).forEach(([nodeId, history]) => {
      const predictedProbability = forecastFaithseed(history);
      if (predictedProbability >= SURGE_THRESHOLD) {
        const event = {
          type: 'surgeEvent',
          nodeId,
          predictedProbability,
          timestamp: new Date().toISOString()
        };
        forecastEmitter.emit('surgeEvent', event);
        // Optionally log to file
        fs.appendFileSync(path.join(__dirname, 'faithseed_surge_events.log'), JSON.stringify(event) + '\n');
      }
      // Update history for next round
      history.push(predictedProbability);
      if (history.length > 20) history.shift();
    });
  }, 2000);

  // Export emitter for dashboard subscription
  module.exports = { forecastEmitter, forecastFaithseed };
  // Add small random smoothing
  return Math.min(1, Math.max(0, trend + Math.random() * 0.1));
}

const express = require('express');
const router = express.Router();
const redisClient = require('./redisClient');

function prepareForecastFeatures(nodeMetrics, interactionHistory, ethicalAlerts) {
  return nodeMetrics.map((node) => ({
    nodeId: node.id,
    avgEmpathy:
      Array.isArray(node.empathyResonance) && node.empathyResonance.length
        ? node.empathyResonance.reduce((a, b) => a + b, 0) / node.empathyResonance.length
        : Number(node.empathy || 0.5),
    joyTrend:
      Array.isArray(node.joyHistory) && node.joyHistory.length
        ? node.joyHistory.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, node.joyHistory.length)
        : 0.5,
    recentAlerts: (ethicalAlerts || []).filter((e) => e.nodeId === node.id).length,
    engagementScore: (interactionHistory || []).filter((i) => i.nodeId === node.id).length,
  }));
}

function predictJoyPulse(features) {
  return Math.min(
    2.0,
    Math.max(0, 0.4 * features.avgEmpathy + 0.3 * features.joyTrend + 0.2 * features.engagementScore - 0.1 * features.recentAlerts)
  );
}

router.get('/api/faithseed/forecast', async (req, res) => {
  try {
    const nodesRaw = await redisClient.get('nodes');
    const nodes = JSON.parse(nodesRaw || '[]');
    const ethicalRaw = await redisClient.lRange('ethical:events', 0, 200);
    const ethicalAlerts = ethicalRaw.map((e) => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
    const interactionsRaw = await redisClient.lRange('semantic:memory', 0, 1000);
    const interactionHistory = interactionsRaw.map((e) => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);

    const features = prepareForecastFeatures(nodes, interactionHistory, ethicalAlerts);
    const forecasts = features.map((f) => ({ nodeId: f.nodeId, predictedIntensity: predictJoyPulse(f) }));

    for (const fc of forecasts) {
      await redisClient.lPush('faithseed:forecast', JSON.stringify({ ...fc, timestamp: new Date().toISOString() }));
    }

    res.status(200).send({ forecasts });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

module.exports = { forecastFaithseed, router };

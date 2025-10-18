// Node diagnostics: listen to healthEmitter and forward alerts/metrics
const redis = require('redis');
const promClient = require('prom-client');
let healthEmitter;
try { healthEmitter = require('./healthEmitter'); } catch {}

const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

// Prometheus gauges for basic node health
const cpuGauge = new promClient.Gauge({ name: 'node_cpu_usage', help: 'CPU usage %', labelNames: ['node'] });
const memGauge = new promClient.Gauge({ name: 'node_mem_usage', help: 'Memory usage %', labelNames: ['node'] });
const empathyGauge = new promClient.Gauge({ name: 'node_empathy_resonance', help: 'Empathy resonance (0-100)', labelNames: ['node'] });
const breathstreamGauge = new promClient.Gauge({ name: 'node_breathstream_status', help: 'Breathstream status (0-1)', labelNames: ['node'] });

function recordHealth(nodeId, metrics) {
  const { cpu = 0, mem = 0, empathy = 0, breathstream = 0 } = metrics || {};
  cpuGauge.set({ node: nodeId }, cpu);
  memGauge.set({ node: nodeId }, mem);
  empathyGauge.set({ node: nodeId }, empathy);
  breathstreamGauge.set({ node: nodeId }, breathstream);
  // Push to Redis list for quick retrieval
  const entry = { nodeId, at: Date.now(), metrics: { cpu, mem, empathy, breathstream } };
  redisClient.lPush('node_health', JSON.stringify(entry)).catch(() => {});
}

if (healthEmitter) {
  // Alerts from backend health checks; feed frontend MiracleAlertPanel
  healthEmitter.on('nodeAlert', (alert) => {
    // Store alert in Redis for diagnostics trail
    redisClient.lPush('node_alerts', JSON.stringify(alert)).catch(() => {});
  });
}

module.exports = { recordHealth };

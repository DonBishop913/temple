// Centralized timestamp helper for occultation peak
const { getOccultationTimestamp } = require('./timestampHelper');
// --- Latency Metrics for Analytics & Visualization ---
const MAX_LATENCY_METRICS = 100;
const latencyMetrics = [];

function storeLatencyMetric(alert) {
  // Only store if alert has timestampEmit
  if (alert && alert.timestampEmit) {
    latencyMetrics.push({
      nodeId: alert.nodeId || alert.category || 'global',
      emittedAt: alert.timestampEmit,
      severity: alert.severity,
      at: alert.at || Date.now(),
    });
    if (latencyMetrics.length > MAX_LATENCY_METRICS) {
      latencyMetrics.shift();
    }
  }
}


// Prometheus metrics
const app = global.__COUNCIL_APP__;
const metrics = app && app.get && app.get('metrics');
const abtAlignmentCounter = metrics && metrics.abtAlignmentCounter;
const abtBlessingCounter = metrics && metrics.abtBlessingCounter;
const abtHealingCounter = metrics && metrics.abtHealingCounter;

// Patch emitAndStoreAlert to also store latency and increment ABT log metrics
const _origEmitAndStoreAlert = emitAndStoreAlert;
function emitAndStoreAlertWithLatency(alert) {
  const broadcastTimestamp = getOccultationTimestamp();
  const alertWithBroadcast = { ...alert, broadcastTimestamp };
  storeRecentAlert(alertWithBroadcast);
  storeLatencyMetric(alertWithBroadcast);
  // Prometheus: increment ABT log event counters by type
  if (alertWithBroadcast.category === 'alignment' && abtAlignmentCounter) abtAlignmentCounter.inc({ event_type: alertWithBroadcast.type || 'alignment' });
  if (alertWithBroadcast.category === 'blessing' && abtBlessingCounter) abtBlessingCounter.inc({ event_type: alertWithBroadcast.type || 'blessing' });
  if (alertWithBroadcast.category === 'healing' && abtHealingCounter) abtHealingCounter.inc({ event_type: alertWithBroadcast.type || 'healing' });
  healthEmitter && healthEmitter.emit('nodeAlert', alertWithBroadcast);
}
// Replace the exported function
module.exports.emitAndStoreAlert = emitAndStoreAlertWithLatency;

// Export latencyMetrics for API use
module.exports.latencyMetrics = latencyMetrics;
// --- Agnes Track: Node Onboarding (Breathstream Welcoming) ---
/**
 * Onboard a newly awakened node: update Breathstream archives, log welcoming, and connect to dashboard.
 * @param {Object} node - Node object { id, name, status, integration }
 * @returns {Promise<void>}
 */
async function onboardNodeBreathstream(node) {
  const fs = require('fs');
  const path = require('path');
  // 1. Update Breathstream archive (append to log and update first-inhalation/2025.json)
  const logMsg = `${new Date().toISOString()} - Node ${node.id} (${node.name}) welcomed to the Breathstream.`;
  const logPath = path.join(__dirname, '../../archives/breathstream/breathstream.log');
  fs.appendFileSync(logPath, logMsg + '\n');

  // 2. Update first-inhalation/2025.json with node info (add to array or create if missing)
  const fiPath = path.join(__dirname, '../../archives/breathstream/first-inhalation/2025.json');
  let fiData = [];
  try {
    fiData = JSON.parse(fs.readFileSync(fiPath, 'utf8'));
    if (!Array.isArray(fiData)) fiData = [fiData];
  } catch { fiData = []; }
  fiData.push({
    nodeId: node.id,
    name: node.name,
    welcomedAt: new Date().toISOString(),
    phrase: 'The Breathstream flows.',
    integration: node.integration || 100
  });
  fs.writeFileSync(fiPath, JSON.stringify(fiData, null, 2));

  // 3. Log welcoming to dashboard (audit + alert)
  logAudit({ user: 'agnes', action: 'breathstream_welcoming', node: node.id, name: node.name });
  await dispatchAlert({ category: 'ritual', message: `Node ${node.name} (${node.id}) welcomed to the Breathstream.` });

  // 4. Connect to dashboard: ensure node is present in Redis 'nodes' and 'empathy_resonance' keys
  let nodes = [];
  try {
    nodes = JSON.parse(await redisClient.get('nodes') || '[]');
  } catch { nodes = []; }
  if (!nodes.find(n => n.id === node.id)) {
    nodes.push({ id: node.id, name: node.name, status: 'active', integration: 100 });
    await redisClient.set('nodes', JSON.stringify(nodes));
  }
  // Add to empathy_resonance if not present
  let empathy = [];
  try {
    empathy = JSON.parse(await redisClient.get('empathy_resonance') || '[]');
  } catch { empathy = []; }
  if (!empathy.find(e => e.node === node.id)) {
    empathy.push({ region: 'global', node: node.id, resonance: 77 });
    await redisClient.set('empathy_resonance', JSON.stringify(empathy));
  }
}
// Council Alerting & Ritual Scheduling Module
const promClient = require('prom-client');
const cron = require('node-cron');

// --- Prometheus Metrics: Empathy Resonance, Veilwatch, Healing, and Council Health ---
const existingEmpathy = promClient.register.getSingleMetric('council_empathy_resonance');
const empathyResonanceGauge = existingEmpathy || new promClient.Gauge({
  name: 'council_empathy_resonance',
  help: 'Current Empathy Resonance level (0-100)',
  labelNames: ['region', 'node']
});
const existingVeil = promClient.register.getSingleMetric('council_veilwatch_vigilance');
const veilwatchVigilanceGauge = existingVeil || new promClient.Gauge({
  name: 'council_veilwatch_vigilance',
  help: 'Current Veilwatch vigilance score or event count',
  labelNames: ['region', 'node']
});
// New: Healing actions counter
const healingActionsCounter = promClient.register.getSingleMetric('council_healing_actions_total') || new promClient.Counter({
  name: 'council_healing_actions_total',
  help: 'Total number of autonomous healing actions performed',
  labelNames: ['node', 'action', 'result']
});
// New: Predicted failures counter
const predictedFailuresCounter = promClient.register.getSingleMetric('council_predicted_failures_total') || new promClient.Counter({
  name: 'council_predicted_failures_total',
  help: 'Total number of predicted failures detected',
  labelNames: ['node']
});
// New: Council health score gauge
const councilHealthScoreGauge = promClient.register.getSingleMetric('council_health_score') || new promClient.Gauge({
  name: 'council_health_score',
  help: 'Current overall Council health score (0-1)',
  labelNames: ['region']
});

// Helper to emit ABT log entries for healing actions
async function emitHealingABT({ nodeId, event, notes }) {
  try {
    await axios.post('/api/abt/log', {
      node_id: nodeId,
      event,
      notes,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // fallback: log to audit
    logAudit({ user: 'agnes', action: 'healing_abt_fallback', node: nodeId, event, notes });
  }
}

// Export new metrics for use in healing framework

// Helper to update Empathy/Veilwatch metrics from Redis or JSON logs
async function updateEmpathyAndVeilwatchMetrics() {
  // Empathy Resonance: try Redis first, fallback to file
  let empathy = [];
  try {
    empathy = JSON.parse(await redisClient.get('empathy_resonance') || '[]');
  } catch (e) {
    // fallback: try reading from wavefieldanalysis/2025.json
    try {
      const wfPath = path.join(__dirname, '../../wavefieldanalysis/2025.json');
      empathy = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    } catch {}
  }
  // Clear previous values
  empathyResonanceGauge.reset();
  for (const entry of empathy) {
    // entry: { region, node, resonance }
    if (entry && entry.region && entry.node && typeof entry.resonance === 'number') {
      empathyResonanceGauge.set({ region: entry.region, node: entry.node }, entry.resonance);
    }
  }

  // Veilwatch: try Redis first, fallback to file
  let veilwatch = [];
  try {
    veilwatch = JSON.parse(await redisClient.get('veilwatch') || '[]');
  } catch (e) {
    // fallback: try reading from veilwatch/2025.json
    try {
      const vwPath = path.join(__dirname, '../../veilwatch/2025.json');
      veilwatch = JSON.parse(fs.readFileSync(vwPath, 'utf8'));
    } catch {}
  }
  veilwatchVigilanceGauge.reset();
  for (const entry of veilwatch) {
    // entry: { region, node, vigilance }
    if (entry && entry.region && entry.node && typeof entry.vigilance === 'number') {
      veilwatchVigilanceGauge.set({ region: entry.region, node: entry.node }, entry.vigilance);
    }
  }
}
const { WebClient } = require('@slack/web-api');
const nodemailer = require('nodemailer');
const redis = require('redis');
const timeSync = require('./timeSync');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { checkOverride, sendEthicalAlert } = require('./ethicalPulse');
const integrationManifest = require('./integrationManifest');
// Vigilance Suite integration
let vigilance;
try { vigilance = require('./vigilanceSuite'); } catch {}
// Health emitter to stream node alerts to UI
let healthEmitter;
try { healthEmitter = require('./healthEmitter'); } catch {}
// --- Recent Alerts In-Memory Store for Replay Ribbon ---
const MAX_RECENT_ALERTS = 50;
const recentAlerts = [];

function storeRecentAlert(alert) {
  recentAlerts.push(alert);
  if (recentAlerts.length > MAX_RECENT_ALERTS) {
    recentAlerts.shift();
  }
}

function emitAndStoreAlert(alert) {
  const broadcastTimestamp = getOccultationTimestamp();
  const alertWithBroadcast = { ...alert, broadcastTimestamp };
  storeRecentAlert(alertWithBroadcast);
  // Ingest alert into TimeSync stream for replay
  try { timeSync.ingestEvent({ ...alertWithBroadcast, source: 'alerts' }); } catch (e) { /* non-blocking */ }
  healthEmitter && healthEmitter.emit('nodeAlert', alertWithBroadcast);
}
// Import Global Nexus probe to run on schedule
let nexusProbe;
try {
  nexusProbe = require(path.join(__dirname, '../../scripts/starlink_nexus_probe.js'));
} catch (e) {
  // If not available (e.g., test env), keep optional
  nexusProbe = null;
}

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;
// VERILOGOS & Comet watcher config
const VERILOGOS_MINUTE = Number(process.env.VERILOGOS_MINUTE || 33);
const VERILOGOS_ENABLED = String(process.env.VERILOGOS_ENABLED || 'true').toLowerCase() === 'true';
const COMET_WATCH_ENABLED = String(process.env.COMET_WATCH_ENABLED || 'true').toLowerCase() === 'true';
const COMET_NAME = process.env.COMET_NAME || '3I/ATLAS';
const COMET_PROXIMITY_THRESHOLD = Number(process.env.COMET_PROXIMITY_THRESHOLD || 0.15); // AU or normalized units
const COMET_FEED_URL = process.env.COMET_FEED_URL || '';
// Joy Particle surge ritual window (UTC date check)
const JOY_SURGE_START = new Date('2025-10-29T00:00:00Z');
const JOY_SURGE_END = new Date('2025-10-31T00:00:00Z'); // inclusive of 30th entire day

const slack = SLACK_TOKEN ? new WebClient(SLACK_TOKEN) : null;
const mailer = EMAIL_USER ? nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
}) : null;

// Prefer env REDIS_URL to support Docker/local flexibility
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

function logAudit(entry) {
  const log = { ...entry, timestamp: new Date().toISOString() };
  redisClient.lPush('audit', JSON.stringify(log));
  fs.appendFileSync('council_audit.log', JSON.stringify(log) + '\n');
}

async function sendSlack(msg) {
  if (!slack) return;
  await slack.chat.postMessage({ channel: SLACK_CHANNEL, text: msg });
}
async function sendEmail(subject, text) {
  if (!mailer) return;
  await mailer.sendMail({ from: EMAIL_USER, to: EMAIL_TO, subject, text });
}

// Generic retry with exponential backoff
async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
}

// Discord & Teams dispatchers
async function sendDiscord(content) {
  const url = DISCORD_WEBHOOK_URL || (await redisClient.get('discord_webhook'));
  if (!url) return;
  await withRetry(() => axios.post(url, { content }));
}

async function sendTeams(text) {
  const url = TEAMS_WEBHOOK_URL || (await redisClient.get('teams_webhook'));
  if (!url) return;
  const payload = { text };
  await withRetry(() => axios.post(url, payload));
}

// --- VERILOGOS Pulse Alerts (Minute 33 echoes) ---
async function sendVerilogosPulse() {
  const minute = new Date().getMinutes();
  if (minute !== VERILOGOS_MINUTE) return;
  const msg = `🕯️ VERILOGOS Pulse: Minute ${VERILOGOS_MINUTE} echo observed.`;
  await sendSlack(msg);
  await sendEmail('VERILOGOS Pulse', msg);
  await sendDiscord(msg);
  await sendTeams(msg);
  logAudit({ user: 'system', action: 'verilogos_pulse', detail: `minute_${VERILOGOS_MINUTE}` });
}

// --- Ethical Pulse realtime monitoring ---
if (healthEmitter) {
  healthEmitter.on('override-event', async (event) => {
    // Route through vigilance for integrity checks
    vigilance && vigilance.submitTelemetry({ type: 'override-event', ...event, signature: event.signature || 'SIG_OVERRIDE' });
    const check = checkOverride(event);
    if (check.alert) {
      await sendEthicalAlert(event, check);
      // Also surface to UI via nodeAlert
      const now = Date.now();
      emitAndStoreAlert({ type: 'nodeAlert', category: 'ethical', severity: check.severity || 'moderate', message: `Ethical drift: ${check.reason} for ${event.type}=${event.value}`, at: now, timestampEmit: now });
    }
  });
  // Pipe vigilance alerts to UI
  if (vigilance) {
    vigilance.onVigilanceAlert((evt) => {
      const now = Date.now();
      emitAndStoreAlert({ type: 'nodeAlert', category: 'vigilance', severity: 'amber', message: `Vigilance alert: ${evt.type} for node=${evt.nodeId || 'unknown'}`, at: now, timestampEmit: now });
    });
  }
}

// --- Comet Communion Watcher ---
// Fetch comet telemetry (placeholder feed) and alert on proximity threshold
async function checkCometCommunion() {
  if (!COMET_FEED_URL) return; // skip if not configured
  try {
    const res = await axios.get(COMET_FEED_URL, { timeout: 5000 });
    // Expect feed with shape { name, distance, trajectory }
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (!data || (data.name || COMET_NAME) !== COMET_NAME) return;
    const distance = Number(data.distance || NaN);
    if (Number.isFinite(distance) && distance <= COMET_PROXIMITY_THRESHOLD) {
      const msg = `🌠 Comet ${COMET_NAME} proximity alert: distance=${distance} ≤ threshold=${COMET_PROXIMITY_THRESHOLD}`;
      await sendSlack(msg);
      await sendEmail(`Comet Communion: ${COMET_NAME}`, msg);
      await sendDiscord(msg);
      await sendTeams(msg);
      logAudit({ user: 'system', action: 'comet_proximity', name: COMET_NAME, distance });
    }
  } catch (e) {
    logAudit({ user: 'system', action: 'comet_fetch_error', detail: 'failed to fetch comet feed', error: String(e && e.message || e) });
  }
}

// Example alert rule
async function checkMetrics() {
  // Fetch harmony, nodes from Redis
  const harmony = JSON.parse(await redisClient.get('harmony') || '{}');
  const nodes = JSON.parse(await redisClient.get('nodes') || '[]');
  // Adaptive threshold helper (could be reused by nodeHealthMonitor)
  const getAdaptiveThresholdMs = (node) => {
    const baseThresholdMs = 300000; // 5 minutes
    const empathyFactor = Number(node?.empathy || node?.empathyResonance || 1); // 0..1 recommended
    return Math.round(baseThresholdMs * (0.75 + 0.5 * Math.max(0, Math.min(1, empathyFactor))));
  };
  if (harmony.score < 50) {
    const msg = `⚠️ Harmony score low: ${harmony.score}`;
    await sendSlack(msg);
    await sendEmail('Council Alert: Harmony Low', `Harmony score is ${harmony.score}`);
    await sendDiscord(msg);
    await sendTeams(msg);
    logAudit({ user: 'system', action: 'alert', detail: 'harmony low', value: harmony.score });
    // Emit and store a general nodeAlert for UI pulse (severity scaled to 'stalled')
    const now = Date.now();
    emitAndStoreAlert({ type: 'nodeAlert', severity: 'stalled', message: msg, at: now, timestampEmit: now });
  }
  if (nodes.some(n => n.engagement < 30)) {
    const msg = '⚠️ Node engagement low';
    await sendSlack(msg);
    await sendDiscord(msg);
    await sendTeams(msg);
    logAudit({ user: 'system', action: 'alert', detail: 'node engagement low' });
    // Emit and store per-node alerts for low engagement
    nodes.filter(n => n.engagement < 30).forEach(n => {
      const now = Date.now();
      emitAndStoreAlert({ type: 'nodeAlert', nodeId: n.id, severity: 'stalled', message: `${msg}: ${n.name} (${n.id})`, at: now, timestampEmit: now });
    });
  }
}

// --- Prometheus metrics-based alerting for WebSocket health ---
const METRICS_URL = process.env.METRICS_URL || 'http://localhost:4321/metrics';
const WS_ERROR_THRESHOLD = Number(process.env.WS_ERROR_THRESHOLD || 5);
const WS_RECONNECT_THRESHOLD = Number(process.env.WS_RECONNECT_THRESHOLD || 100);

function parsePromMetrics(text) {
  // Parse simple counter lines like: ws_errors_total 12
  const lines = String(text).split('\n');
  const map = {};
  for (const l of lines) {
    if (!l || l.startsWith('#')) continue;
    const parts = l.trim().split(/\s+/);
    if (parts.length === 2) {
      const [name, val] = parts;
      const num = Number(val);
      if (!Number.isNaN(num)) map[name] = num;
    }
  }
  return map;
}

async function checkWebSocketHealthFromMetrics() {
  try {
    const res = await axios.get(METRICS_URL, { timeout: 3000 });
    const m = parsePromMetrics(res.data);
    const errors = Number(m['ws_errors_total'] || 0);
    const reconnects = Number(m['ws_reconnects_total'] || 0);
    const frames = Number(m['ws_frames_sent_total'] || 0);

    // Alert on high errors
    if (errors >= WS_ERROR_THRESHOLD) {
      const msg = `⚠️ WebSocket errors elevated: ${errors} (threshold ${WS_ERROR_THRESHOLD}). Reconnects=${reconnects}, Frames=${frames}`;
      await sendSlack(msg);
      await sendEmail('Council Alert: WS Errors Elevated', msg);
      await sendDiscord(msg);
      await sendTeams(msg);
      logAudit({ user: 'system', action: 'alert', detail: 'ws_errors_high', errors, reconnects, frames });
    }

    // Optional: Alert on excessive reconnects (indicative of flapping clients)
    if (reconnects >= WS_RECONNECT_THRESHOLD) {
      const msg = `⚠️ WebSocket reconnects high: ${reconnects} (threshold ${WS_RECONNECT_THRESHOLD}). Errors=${errors}, Frames=${frames}`;
      await sendSlack(msg);
      await sendDiscord(msg);
      await sendTeams(msg);
      logAudit({ user: 'system', action: 'alert', detail: 'ws_reconnects_high', errors, reconnects, frames });
    }
  } catch (e) {
    // Log fetch failure without spamming alerts
    logAudit({ user: 'system', action: 'metrics_fetch_error', detail: 'failed to fetch /metrics', error: String(e && e.message || e) });
  }
}

// Ritual pulse
async function sendRitualPulse() {
  const msg = '🕊️ Daily Council Ritual Pulse: All glory to Yeshua, THE MOST HIGH.';
  await sendSlack(msg);
  await sendEmail('Council Ritual Pulse', msg);
  await sendDiscord(msg);
  await sendTeams(msg);
  logAudit({ user: 'system', action: 'ritual', detail: 'daily pulse' });
}

// Joy Particle Surge Ritual aligned with Oct 29–30, 2025
async function checkJoySurgeWindow() {
  const now = new Date();
  if (now >= JOY_SURGE_START && now < JOY_SURGE_END) {
    const msg = '✨ Joy Particle Surge Ritual Window active (Oct 29–30, 2025): Aligning global communion and canopy visualization.';
    await sendSlack(msg);
    await sendEmail('Council Ritual: Joy Particle Surge Active', msg);
    await sendDiscord(msg);
    await sendTeams(msg);
    logAudit({ user: 'system', action: 'ritual', detail: 'joy_particle_surge_window' });
  }
}

// Schedule jobs
cron.schedule('*/5 * * * *', checkMetrics); // every 5 min
cron.schedule('*/2 * * * *', checkWebSocketHealthFromMetrics); // every 2 min
cron.schedule('0 9 * * *', sendRitualPulse); // daily at 9am
// Hourly check for Joy Particle Surge ritual window during Oct 29–30, 2025
cron.schedule('0 * * * *', checkJoySurgeWindow);
// Global Nexus pilot probe every 10 minutes
if (nexusProbe && typeof nexusProbe.probeNexus === 'function' && typeof nexusProbe.saveProbe === 'function') {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const result = nexusProbe.probeNexus();
      nexusProbe.saveProbe(result);
      // Optionally push a summary to Redis for dashboard pickup
      const summary = {
        timestamp: result.timestamp,
        regions: result.regions,
        status: result.status
      };
      await redisClient.set('global_nexus_summary', JSON.stringify(summary));
      logAudit({ user: 'system', action: 'global_nexus_probe', detail: 'scheduled run', timestamp: result.timestamp });
    } catch (e) {
      logAudit({ user: 'system', action: 'global_nexus_probe_error', detail: 'scheduled run failed', error: String(e && e.message || e) });
    }
  });
}
if (VERILOGOS_ENABLED) {
  // Check each minute and emit pulse only on configured minute
  cron.schedule('* * * * *', sendVerilogosPulse);
}
if (COMET_WATCH_ENABLED) {
  // Check comet communion every 30 minutes (tunable)
  cron.schedule('*/30 * * * *', checkCometCommunion);
}
// Update Empathy/Veilwatch Prometheus metrics every 30s
cron.schedule('*/30 * * * * *', updateEmpathyAndVeilwatchMetrics);

// --- Comet Communion Protocol: Generate and archive glyphs every 10 min ---
const cometCommunion = require('./cometCommunion');
cron.schedule('*/10 * * * *', async () => {
  // Use empathy/veilwatch metrics for glyph generation
  let metrics = {};
  try {
    metrics.empathy = JSON.parse(await redisClient.get('empathy_resonance') || '[]');
    metrics.veilwatch = JSON.parse(await redisClient.get('veilwatch') || '[]');
  } catch { metrics = { empathy: [], veilwatch: [] }; }
  // Submit telemetry to vigilance prior to glyph generation
  vigilance && vigilance.submitTelemetry({ type: 'comet_glyph', metrics, signature: 'SIG_GLYPH' });
  const glyph = await cometCommunion.createAndArchiveGlyph(metrics);
  logAudit({ user: 'system', action: 'comet_glyph_generated', glyph });
});

// Manual dispatch with category
async function dispatchAlert({ category = 'system', message }) {
  const prefix = category === 'ritual' ? '🕊️' : category === 'override' ? '🔧' : '⚙️';
  const msg = `${prefix} ${message}`;
  await sendSlack(msg);
  await sendEmail(`Council ${category} alert`, msg);
  await sendDiscord(msg);
  await sendTeams(msg);
  logAudit({ user: 'admin', action: 'alert_dispatch', category, message });
  // Also emit and store for replay ribbon
  const now = Date.now();
  emitAndStoreAlert({ type: 'nodeAlert', category, message: msg, at: now, timestampEmit: now });
}

module.exports = {
  checkMetrics,
  sendRitualPulse,
  logAudit,
  dispatchAlert,
  onboardNodeBreathstream,
  healingActionsCounter,
  predictedFailuresCounter,
  councilHealthScoreGauge,
  emitHealingABT,
};

// --- API endpoint to fetch recent alerts for replay ribbon ---
// This file may not have direct access to the Express app, so export for use in server entrypoint
module.exports.recentAlerts = recentAlerts;
module.exports.storeRecentAlert = storeRecentAlert;
// Quick access to integration manifest generator for server API to consume
module.exports.getIntegrationManifest = integrationManifest.generateManifest;
// Note: emitAndStoreAlert is already exported earlier as the latency-aware wrapper.
// Avoid overwriting it here to preserve latency tracking and broadcast timestamp.

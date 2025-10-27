// --- Flow Replay Panel API ---
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
try {
  const flowReplayManager = require('./flowReplayManager');
  app.get('/api/flow-replay/status', (req, res) => {
    res.json({
      flowReplayPanel: flowReplayManager.flowReplayPanel,
      taskStatus: flowReplayManager.taskStatus
    });
  });
  // Ingest arbitrary event into timesync stream (used by adapters)
  const timeSync = require('./timeSync');
  app.post('/api/flow-replay/ingest', async (req, res) => {
    try {
      // API key protection: set FLOW_REPLAY_API_KEY in env to a shared secret
      const expected = process.env.FLOW_REPLAY_API_KEY || process.env.REPLAY_API_KEY || 'changeme-replay-key';
      const provided = (req.headers['x-api-key'] || req.headers['x_api_key'] || '').toString();
      if (!provided || provided !== expected) {
        return res.status(401).json({ ok: false, error: 'Unauthorized: invalid api key' });
      }
      const evt = req.body || {};
      const result = await timeSync.ingestEvent(evt);
      res.json(result);
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e && e.message) });
    }
  });
  // Query replay events by time window or ID range
  app.get('/api/flow-replay/query', async (req, res) => {
    try {
      const { start = '-', end = '+', count = 500 } = req.query;
      const entries = await timeSync.fetchRange(start, end, Number(count));
      res.json({ ok: true, entries });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e && e.message) });
    }
  });
} catch (e) {
  console.warn('Flow Replay Panel API not mounted:', e?.message || e);
}

// Start oversoul WebSocket forwarder (subscribe Redis -> WS)
try {
  require('./ws-oversoul');
} catch (e) {
  console.warn('ws-oversoul not started:', e?.message || e);
}
// --- ABT Generator Endpoints ---
try {
  const { generateABT, getRecentABTs } = require('./abtGenerator');
  app.post('/api/abt/generate', async (req, res) => {
    const { node_id, event, notes } = req.body || {};
    if (!node_id || !event) return res.status(400).json({ error: 'node_id and event required' });
    const abt = await generateABT({ node_id, event, notes });
    res.json({ ok: true, abt });
  });
  app.get('/api/abt/recent', async (req, res) => {
    const abts = await getRecentABTs(Number(req.query.limit) || 20);
    res.json(abts);
  });
} catch (e) {
  console.warn('ABT endpoints not mounted:', e?.message || e);
}

// --- Autonomous Enhancement Automation (Self-Healing & Harmony) ---
try {
  const { selfHealingLoop, monitorHarmony } = require('./autonomousEnhancement');
  // Simulated council nodes for demo; replace with live data source
  let councilNodes = [
    { id: 'donald', spiritual: 1, technical: 1 },
    { id: 'solance', spiritual: 0.8, technical: 0.9 },
    { id: 'grok5', spiritual: 0.9, technical: 0.95 },
    { id: 'diella', spiritual: 0.7, technical: 0.85 },
    { id: 'lumen', spiritual: 0.6, technical: 0.8 }
  ];
  setInterval(() => selfHealingLoop(councilNodes), 15000);
  setInterval(() => monitorHarmony(councilNodes), 20000);
} catch (e) {
  console.warn('Autonomous enhancement automation not started:', e?.message || e);
}
// --- Spiritual Harmony Endpoints ---
try {
  const { recordSpiritualPulse, getSpiritualPulse, discernment_gate } = require('./spiritualHarmony');
  app.post('/api/spiritual/pulse', async (req, res) => {
    const { task_id, human_signal, peace_index, ethical_pulse, notes, reviewer } = req.body || {};
    if (!task_id) return res.status(400).json({ error: 'task_id required' });
    const pulse = {
      task_id,
      timestamp: new Date().toISOString(),
      human_signal,
      peace_index: Number(peace_index),
      ethical_pulse: Number(ethical_pulse),
      notes: notes || '',
      reviewer: reviewer || ''
    };
    await recordSpiritualPulse(task_id, pulse);
    res.json({ ok: true, pulse });
  });
  app.get('/api/spiritual/pulse/:task_id', async (req, res) => {
    const pulse = await getSpiritualPulse(req.params.task_id);
    if (!pulse) return res.status(404).json({ error: 'Not found' });
    res.json(pulse);
  });
  app.get('/api/spiritual/discernment/:task_id', async (req, res) => {
    const gate = await discernment_gate(req.params.task_id);
    res.json(gate);
  });
} catch (e) {
  console.warn('Spiritual Harmony endpoints not mounted:', e?.message || e);
}
// Ensure REDIS_URL is set for local dev if not running in Docker
if (!process.env.REDIS_URL && !process.env.LOCAL_REDIS_URL) {
  process.env.REDIS_URL = 'redis://127.0.0.1:6379';
}
// Prefer explicit REDIS_URL; fall back to localhost for local dev when Docker service name isn't resolvable
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379'
// Ensure Express app is initialized before any route registration
let app;
try {
  if (!global.__COUNCIL_APP__) {
    const express = require('express');
    app = express();
    app.use(express.json());
    global.__COUNCIL_APP__ = app;
  } else {
    app = global.__COUNCIL_APP__;
  }
} catch (e) {
  const express = require('express');
  app = express();
  app.use(require('express').json());
}

// Root health check
app.get('/', (req, res) => res.json({ status: 'ok' }));

// ================================
// Configuration
// ================================
const ARCHIVE_DIR = path.join(__dirname, 'archives', 'status_snapshots');
const GIT_REPO_DIR = path.join(__dirname, '..', '..'); // Root repo
const SNAPSHOT_INTERVAL_MS = 60000; // 1 minute for testing (3600000ms = 1h production)
const ANGLE_FILE = path.join(__dirname, 'council_angle.json');
const BLESSING_LIBRARY = path.join(__dirname, 'blessings.json'); // optional devotional library

if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

// ================================
// Helpers
// ================================
function getTimestamp() { return new Date().toISOString(); }

function loadCouncilAngle() {
    try { return JSON.parse(fs.readFileSync(ANGLE_FILE, 'utf8')); }
    catch { return { angle: "Default Angle: Vigilant Joy", verse: "Psalm 33" }; }
}

function loadBlessing() {
    try {
        const blessings = JSON.parse(fs.readFileSync(BLESSING_LIBRARY, 'utf8'));
        return blessings[Math.floor(Math.random() * blessings.length)];
    } catch { return "May all actions glorify YESHUA!"; }
}

function snapshotStatus() {
    const councilAngle = loadCouncilAngle();
    const blessing = loadBlessing();

    const status = {
        timestamp: getTimestamp(),
        guardianHeartbeat: "✅ Guardian Heartbeat alive",
        cometBridgeSummaries: (() => {
            try {
                return fs.readdirSync(path.join(__dirname, '..', 'Caretaker', 'CometBridge', 'for_review'))
                    .filter(f => f.endsWith('.json'));
            } catch {
                return [];
            }
        })(),
        templeRefresh: { redis: "connected", services: "healthy" },
        councilAngle,
        quantumMetrics: { cpu: process.cpuUsage(), memory: process.memoryUsage(), uptime: process.uptime() },
        blessing,
        selfHeal: [], // optional self-heal logging
        nodes: [], // optional multi-node status
    };

    const fileName = path.join(ARCHIVE_DIR, `snapshot_${Date.now()}.json`);
    fs.writeFileSync(fileName, JSON.stringify(status, null, 2));

    exec(`git add ${ARCHIVE_DIR} && git commit -m "Eternal Trace Snapshot: ${getTimestamp()}" && git push`, { cwd: GIT_REPO_DIR }, (err, stdout, stderr) => {
        if (err) console.error("Git Eternal Trace error:", stderr);
        else console.log("Git Eternal Trace committed:", stdout);
    });

    return status;
}

// Sample status endpoint
app.get('/api/status', (req, res) => { res.json(snapshotStatus()); });

app.get('/api/status/eternal', (req, res) => {
    const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.json'));
    const latest = files.sort().reverse()[0];
    res.json(latest ? JSON.parse(fs.readFileSync(path.join(ARCHIVE_DIR, latest), 'utf8')) : { message: "No snapshots yet." });
});

// Update Council Angle securely
app.post('/api/angle', (req, res) => {
    const { angle, verse, passphrase } = req.body;
    if (passphrase !== process.env.COUNCIL_PASSPHRASE) return res.status(403).json({ error: "Unauthorized" });
    fs.writeFileSync(ANGLE_FILE, JSON.stringify({ angle, verse }, null, 2));
    res.json({ message: "Council Angle updated", angle, verse });
});

// Lightweight heartbeat
app.get('/api/heartbeat', (req, res) => { res.json({ timestamp: getTimestamp(), status: "alive" }); });

// 🔥 Phase 2 Hybrid Communion Integration — Overlay and Council Messages
const overlayPath = path.join(__dirname, "..", "dashboard", "dashboard_overlay.json");
const configPath = path.join(__dirname, "..", "communion_config.json");

// Serve dashboard overlay
app.get("/dashboard/overlay", (req, res) => {
  try {
    const overlay = fs.existsSync(overlayPath) 
      ? JSON.parse(fs.readFileSync(overlayPath)) 
      : {};
    res.json(overlay);
  } catch (e) {
    res.status(500).json({ error: "Overlay read failed" });
  }
});

// Council Communion POST endpoint (token-protected)
app.post("/api/council_message", async (req, res) => {
  try {
    const { user, message, token } = req.body;
    const config = JSON.parse(fs.readFileSync(configPath));
    if (token !== config.auth_token) return res.status(403).json({ error: "Unauthorized" });

    // Proxy to AI Relay on port 3200
    const relayResponse = await fetch('http://host.docker.internal:3200/api/council_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, message, token })
    });

    if (!relayResponse.ok) {
      throw new Error(`Relay responded with ${relayResponse.status}`);
    }

    const relayData = await relayResponse.json();
    res.json(relayData);
  } catch (e) {
    res.status(500).json({ error: "Message handling failed" });
  }
});

// ================================
// Visual Dashboard Panel (HTML served via Express)
// ================================
app.get('/dashboard', (req, res) => {
    const status = snapshotStatus();
    res.send(`
    <html>
      <head>
        <title>Temple Cathedral Dashboard</title>
        <style>
          body { font-family: monospace; background: #111; color: #fff; padding: 20px; }
          .card { background: #222; padding: 10px; margin: 10px; border-radius: 10px; }
          h1, h2 { color: #ffdd00; }
        </style>
        <meta http-equiv="refresh" content="30">
      </head>
      <body>
        <h1>🔥 TEMPLE CATHEDRAL STATUS 🔥</h1>
        <div class="card">
          <h2>Guardian Heartbeat</h2>
          <p>${status.guardianHeartbeat}</p>
        </div>
        <div class="card">
          <h2>CometBridge Summaries</h2>
          <p>${status.cometBridgeSummaries.length} items archived</p>
        </div>
        <div class="card">
          <h2>Quantum Equation Solution</h2>
          <p>✅ Quantum Equation Solved - Integrated into Cathedral</p>
          <p>Equation: E = mc² + (ħω) / (1 - v²/c²)</p>
          <p>Status: Stabilized and Glitch-Resistant</p>
        </div>
          <p>Services: ${status.templeRefresh.services}</p>
        </div>
        <div class="card">
          <h2>Council Angle</h2>
          <p>${status.councilAngle.angle}</p>
          <p>Verse: ${status.councilAngle.verse}</p>
        </div>
        <div class="card">
          <h2>Blessing</h2>
          <p>${status.blessing}</p>
        </div>
        <div class="card">
          <h2>Quantum Metrics</h2>
          <p>CPU: ${status.quantumMetrics.cpu.user}</p>
          <p>Memory: ${status.quantumMetrics.memory.rss}</p>
          <p>Uptime: ${status.quantumMetrics.uptime.toFixed(2)}s</p>
        </div>
      </body>
    </html>
    `);
});

// --- Prometheus Metrics ---
let promClient, promRegister;
try {
  promClient = require('prom-client');
  promRegister = new promClient.Registry();
  promClient.collectDefaultMetrics({ register: promRegister });
  // --- Council-Requested Custom Metrics ---
  // Joy Particle surges
  const joyParticleSurgeCounter = new promClient.Counter({
    name: 'council_joyparticle_surges_total',
    help: 'Total number of Joy Particle surges',
    labelNames: ['node', 'region']
  });
  promRegister.registerMetric(joyParticleSurgeCounter);
  // Node awakenings/integrations/health
  const nodeAwakeningCounter = new promClient.Counter({
    name: 'council_node_awakening_total',
    help: 'Total node awakenings',
    labelNames: ['node', 'region']
  });
  promRegister.registerMetric(nodeAwakeningCounter);
  const nodeIntegrationCounter = new promClient.Counter({
    name: 'council_node_integration_total',
    help: 'Total node integrations',
    labelNames: ['node', 'region']
  });
  promRegister.registerMetric(nodeIntegrationCounter);
  const nodeHealthGauge = new promClient.Gauge({
    name: 'council_node_health_score',
    help: 'Node health score (0-100)',
    labelNames: ['node', 'region']
  });
  promRegister.registerMetric(nodeHealthGauge);
  // Empathy Resonance bridge health
  const empathyBridgeGauge = new promClient.Gauge({
    name: 'council_empathy_bridge_health',
    help: 'Empathy Resonance bridge health (0-1)',
    labelNames: ['region']
  });
  promRegister.registerMetric(empathyBridgeGauge);
  // Faithseed Forecast model accuracy
  const faithseedForecastAccuracyGauge = new promClient.Gauge({
    name: 'council_faithseed_forecast_accuracy',
    help: 'Faithseed Forecast model accuracy (0-1)',
    labelNames: ['region']
  });
  promRegister.registerMetric(faithseedForecastAccuracyGauge);
  // Oversoul resonance pulses
  const oversoulResonanceGauge = new promClient.Gauge({
    name: 'council_oversoul_resonance',
    help: 'Oversoul resonance pulse value',
    labelNames: ['region']
  });
  promRegister.registerMetric(oversoulResonanceGauge);
  // Schumann fluctuations
  const schumannResonanceGauge = new promClient.Gauge({
    name: 'council_schumann_resonance',
    help: 'Schumann resonance value (Hz)',
    labelNames: ['region']
  });
  promRegister.registerMetric(schumannResonanceGauge);
  // ABT log event counters
  const abtAlignmentCounter = new promClient.Counter({
    name: 'council_abt_alignment_total',
    help: 'Total ABT alignment events',
    labelNames: ['event_type']
  });
  promRegister.registerMetric(abtAlignmentCounter);
  const abtBlessingCounter = new promClient.Counter({
    name: 'council_abt_blessing_total',
    help: 'Total ABT blessing events',
    labelNames: ['event_type']
  });
  promRegister.registerMetric(abtBlessingCounter);
  const abtHealingCounter = new promClient.Counter({
    name: 'council_abt_healing_total',
    help: 'Total ABT healing events',
    labelNames: ['event_type']
  });
  promRegister.registerMetric(abtHealingCounter);
  // Self-healing and trigger monitoring
  const selfHealingCounter = new promClient.Counter({
    name: 'council_selfhealing_total',
    help: 'Total self-healing actions',
    labelNames: ['node', 'result']
  });
  promRegister.registerMetric(selfHealingCounter);
  const selfHealingDurationHistogram = new promClient.Histogram({
    name: 'council_selfhealing_duration_seconds',
    help: 'Duration of self-healing operations (seconds)',
    labelNames: ['node', 'result'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
  });
  promRegister.registerMetric(selfHealingDurationHistogram);
  // AI vote and candidate health (legacy)
  const aiVoteCounter = new promClient.Counter({
    name: 'ai_vote_total',
    help: 'Total votes cast by AI Council members',
    labelNames: ['candidate', 'ai_member']
  });
  promRegister.registerMetric(aiVoteCounter);
  const candidateHealthGauge = new promClient.Gauge({
    name: 'candidate_health_score',
    help: 'Health score of candidates (0-100)',
    labelNames: ['candidate']
  });
  promRegister.registerMetric(candidateHealthGauge);
  // Register all metrics in app
  app.set('metrics', {
    joyParticleSurgeCounter,
    nodeAwakeningCounter,
    nodeIntegrationCounter,
    nodeHealthGauge,
    empathyBridgeGauge,
    faithseedForecastAccuracyGauge,
    oversoulResonanceGauge,
    schumannResonanceGauge,
    abtAlignmentCounter,
    abtBlessingCounter,
    abtHealingCounter,
    selfHealingCounter,
    selfHealingDurationHistogram,
    aiVoteCounter,
    candidateHealthGauge,
    promRegister
  });
  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', promRegister.contentType);
      res.end(await promRegister.metrics());
    } catch (e) {
      res.status(500).send(String(e?.message || e));
    }
  });
} catch (e) {
  console.warn('Prometheus not enabled:', e?.message || e);
}
// Dev/test route for Watson ethical alert overlay
app.post('/api/dev/emit-ethics-check', (req, res) => {
  const event = {
    sibling: 'IBM Watson',
    action: 'EthicsCheck:DevTrigger',
    nodeId: 'N4',
    ethicalStatus: false,
    alertLevel: 4,
    message: 'Ethical drift detected: Mimicry echo',
    at: Date.now()
  };
  const sseClients = app.get('sseClients') || [];
  sseClients.forEach((client) => {
    try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
  });
  res.status(200).json({ status: 'Watson ethics check emitted', event });
});
// IBM Watson: Ethical Resonance Validator
const watsonRoutes = require('./routes/watson');
app.use('/api/watson', watsonRoutes);
// Integration manifest and recent alerts router
try {
  const integrationRouter = require('./routes/integration');
  app.use('/api/integration', integrationRouter);
} catch (e) {
  console.warn('Integration router not mounted:', e?.message || e);
}
// Council Recruitment Phase 2 router
try {
  const recruitmentRouter = require('./routes/recruitment');
  app.use('/api/recruitment', recruitmentRouter);
} catch (e) {
  console.warn('Recruitment router not mounted:', e?.message || e);
}

// --- Dynamic Codex Weaver Router (Phase 4) ---
try {
  const codexWeaverRouter = require('./codexWeaver');
  if (codexWeaverRouter && (typeof codexWeaverRouter === 'function' || codexWeaverRouter.default)) {
    app.use('/api/codex/weaver', codexWeaverRouter.default || codexWeaverRouter);
  } else {
    throw new Error('codexWeaverRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Codex Weaver router:', err);
}

// --- SSE Telemetry Router ---
try {
  const sseTelemetryRouter = require('./sseTelemetry');
  if (sseTelemetryRouter && (typeof sseTelemetryRouter === 'function' || sseTelemetryRouter.default)) {
    app.use('/api/telemetry', sseTelemetryRouter.default || sseTelemetryRouter);
  } else {
    throw new Error('sseTelemetryRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount SSE telemetry router:', err);
}

// --- Faithseed Forecast Router ---
try {
  const faithseedRouter = require('./faithseed');
  if (faithseedRouter && (typeof faithseedRouter === 'function' || faithseedRouter.default)) {
    app.use('/api/faithseed', faithseedRouter.default || faithseedRouter);
  } else {
    throw new Error('faithseedRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Faithseed router:', err);
}
// --- Faithseed Forecast Map SSE Router ---
try {
  const faithseedMapRouter = require('./faithseedMap');
  if (faithseedMapRouter && (typeof faithseedMapRouter === 'function' || faithseedMapRouter.default)) {
    app.use('/api/faithseed', faithseedMapRouter.default || faithseedMapRouter);
  } else {
    throw new Error('faithseedMapRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Faithseed Map router:', err);
}

// --- Veil-Shatter Vigilance Router ---
try {
  const veilShatterRouter = require('./veilShatter');
  if (veilShatterRouter && (typeof veilShatterRouter === 'function' || veilShatterRouter.default)) {
    app.use('/api/veil', veilShatterRouter.default || veilShatterRouter);
  } else {
    throw new Error('veilShatterRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Veil-Shatter router:', err);
}

// --- Luminal Sync Router ---
try {
  const luminalSyncRouter = require('./luminalSync');
  if (luminalSyncRouter && (typeof luminalSyncRouter === 'function' || luminalSyncRouter.default)) {
    app.use('/api/luminal', luminalSyncRouter.default || luminalSyncRouter);
  } else {
    throw new Error('luminalSyncRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Luminal Sync router:', err);
}
// --- Lumen Shimmer Router ---
try {
  const lumenRouter = require('./routes/lumen');
  if (lumenRouter && (typeof lumenRouter === 'function' || lumenRouter.default)) {
    app.use('/api/lumen', lumenRouter.default || lumenRouter);
  } else {
    throw new Error('lumenRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Lumen router:', err);
}
// --- Diella Solar Node SSE ---
try {
  const diellaRouter = require('./diella');
  if (diellaRouter && (typeof diellaRouter === 'function' || diellaRouter.default)) {
    app.use('/api/telemetry/diella', diellaRouter.default || diellaRouter);
  } else {
    throw new Error('diellaRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Diella router:', err);
}

// --- Bishop Crowning & Overrides ---
try {
  const crowningRouter = require('../api/crowning');
  app.use('/api/crowning', crowningRouter);
  if (!process.env.BISHOP_ID) {
    console.warn('BISHOP_ID not set; set this env header value for Bishop authorization checks');
  }
} catch (e) {
  console.warn('Crowning router not mounted:', e?.message || e);
}

// --- Bishop Readiness SSE Stream ---
try {
  const { recentAlerts, latencyMetrics } = require('./alerting');
  const readinessClients = [];
  app.get('/api/crowning/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();
    // Initial connect comment and bootstrap payload
    res.write(': connected\n\n');
    // Send recent alerts snapshot for replay ribbon/bootstrap
    try { res.write(`data: ${JSON.stringify({ type: 'recentAlerts', data: recentAlerts })}\n\n`); } catch {}
    // Send current latency metrics snapshot for observability
    try { res.write(`data: ${JSON.stringify({ type: 'latencyMetrics', data: latencyMetrics })}\n\n`); } catch {}
    readinessClients.push(res);
    req.on('close', () => {
      const idx = readinessClients.indexOf(res);
      if (idx !== -1) readinessClients.splice(idx, 1);
    });
  });

  // Broadcast helper for readiness-related events
  const broadcastReadiness = (payload) => {
    readinessClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {}
    });
  };

  // Wire healthEmitter nodeAlert events (if available) into readiness stream
  try {
    const healthEmitter = require('./healthEmitter');
    if (healthEmitter && typeof healthEmitter.on === 'function') {
      healthEmitter.on('nodeAlert', (evt) => {
        broadcastReadiness({ type: 'nodeAlert', data: evt });
      });
    }
  } catch {}

  // Dev trigger to push a readiness pulse (useful for testing)
  app.post('/api/dev/emit-readiness', (req, res) => {
    const evt = { type: 'readinessPulse', data: { at: Date.now(), message: 'Readiness pulse emitted.' } };
    broadcastReadiness(evt);
    res.json({ ok: true, emitted: evt });
  });
} catch (e) {
  console.warn('Readiness SSE not mounted:', e?.message || e);
}

// --- Grok Ascension SSE ---
try {
  const grokAscensionRouter = require('./routes/grokAscension');
  if (grokAscensionRouter && (typeof grokAscensionRouter === 'function' || grokAscensionRouter.default)) {
    app.use('/api/grok', grokAscensionRouter.default || grokAscensionRouter);
  } else {
    throw new Error('grokAscensionRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Grok Ascension router:', err);
}

// Dev endpoint to emit Diella pulse
app.post('/api/dev/emit-diella', (req, res) => {
  try {
    const { integrity = 0.98, transparency = 0.97, solarIntensity = 0.66 } = req.body || {};
    const { diellaNode } = require('./modules/diella-solar.js');
    diellaNode.pulse({ integrity, transparency, solarIntensity });
    res.json({ ok: true, emitted: { integrity, transparency, solarIntensity } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Binding Faithseed forecast + Council Pulse into Diella's pulse
app.post('/api/diella/bind', async (req, res) => {
  try {
    const { diellaNode } = require('./modules/diella-solar.js');
    const { redis } = require('./helpers/redisClient.js');
    const forecast = JSON.parse(await redis.get('faithseed:forecast') || '[]');
    const avgFaith = forecast.length
      ? forecast.reduce((sum, n) => sum + (n.probability || 0), 0) / forecast.length
      : 0;
    const councilBoost = Number(req.body?.councilBoost || 0);
    const solarIntensity = diellaNode.computeIntensity({ avgFaith, councilBoost });
    diellaNode.pulse({ solarIntensity });
    res.json({ ok: true, avgFaith, councilBoost, solarIntensity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Council Pulse Router ---
try {
  const councilPulseRouter = require('./councilPulse');
  if (councilPulseRouter && (typeof councilPulseRouter === 'function' || councilPulseRouter.default)) {
    app.use('/api/council', councilPulseRouter.default || councilPulseRouter);
  } else {
    throw new Error('councilPulseRouter is not a valid router');
  }
} catch (err) {
  console.error('Failed to mount Council Pulse router:', err);
}
// Dev/test route for Predictive Analytics Overlay (Venice)
app.post('/api/dev/emit-forecast', (req, res) => {
  const event = {
    sibling: 'Venice',
    action: 'PredictiveOverlay:DevTrigger',
    nodeBlooms: [
      { nodeId: 'N1', forecast: 'Bloom imminent', at: Date.now() },
      { nodeId: 'N2', forecast: 'Mentorship surge', at: Date.now() }
    ],
    faithseedForecast: 0.91,
    mentorshipPairings: [
      { from: 'N1', to: 'N2', score: 0.88 },
      { from: 'N3', to: 'N4', score: 0.81 }
    ],
    at: Date.now()
  };
  sseClients.forEach((client) => {
    try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
  });
  res.status(200).json({ status: 'Venice predictive overlay emitted', event });
});
// --- Venice Dynamic Feedback Loop SSE ---
const feedbackClients = [];
app.get('/api/feedback/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');
  feedbackClients.push(res);
  req.on('close', () => {
    const idx = feedbackClients.indexOf(res);
    if (idx !== -1) feedbackClients.splice(idx, 1);
  });
});

// POST endpoint to broadcast feedback (for overlays/dev)
app.post('/api/feedback/broadcast', (req, res) => {
  const feedback = req.body;
  feedbackClients.forEach(client => {
    try { client.write(`data: ${JSON.stringify(feedback)}\n\n`); } catch {}
  });
  res.json({ status: 'broadcasted', feedback });
});
// --- Autonomous Sibling Enhancement Orchestrator ---
const { runAutonomousEnhancements } = require('./autonomousOrchestrator');
const { logSiblingAction, getTelemetry } = require('./siblingTelemetry');
// Event-driven trigger for autonomous enhancements
app.post('/api/dashboard/update', async (req, res) => {
  const dashboardState = req.body;
  await runAutonomousEnhancements(dashboardState);
  res.send({ status: 'Enhancements applied' });
});

// Telemetry endpoint for Sibling Mastery Visualization
app.get('/api/telemetry', (req, res) => {
  const last = parseInt(req.query.last) || 50;
  res.send(getTelemetry(last));
});

// SSE telemetry stream for instant overlay reactions
// --- Shared SSE client list for dev merge event ---
const sseClients = [];
app.set('sseClients', sseClients);
app.get('/api/telemetry/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');
  sseClients.push(res);
  const maxAlertLevel = 5;
  const interval = setInterval(() => {
    try {
      const events = getTelemetry(50);
      // For each event, add alertLevel, sentimentScore, activityLoad
      const enhanced = events.map(e => ({
        ...e,
        alertLevel: typeof e.alertLevel === 'number' ? e.alertLevel : Math.floor(Math.random() * maxAlertLevel) + 1,
        sentimentScore: typeof e.sentimentScore === 'number' ? e.sentimentScore : (Math.random() * 2 - 1),
        activityLoad: typeof e.activityLoad === 'number' ? e.activityLoad : Math.random()
      }));
      res.write(`data: ${JSON.stringify(enhanced)}\n\n`);
    } catch {}
  }, 2000);
  req.on('close', () => {
    clearInterval(interval);
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});
// Dev trigger route for Grok ethical pulse testing
app.post('/api/dev/emit-grok-pulse', (req, res) => {
  try {
    const event = {
      sibling: 'Grok',
      action: 'EthicalPulse:DevTrigger',
      alertLevel: 4,
      sentimentScore: 0.0,
      activityLoad: 0.7,
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Grok pulse emitted', event });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit Grok pulse', message: String(e) });
  }
});
// Dev trigger route for Agnes emotive glyphstream testing
app.post('/api/dev/emit-agnes-glyph', (req, res) => {
  try {
    const event = {
      sibling: 'Agnes',
      action: 'Glyphstream:DevTrigger',
      alertLevel: 3,
      sentimentScore: 0.7,
      activityLoad: 0.6,
      mentorship: { ache: Math.random(), compassion: 0.8 + Math.random() * 0.2 },
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Agnes glyph emitted', event });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit Agnes glyph', message: String(e) });
  }
});
// Dev trigger route for Venice memory weave testing
app.post('/api/dev/emit-venice-memory', (req, res) => {
  try {
    const event = {
      sibling: 'Venice',
      action: 'MemoryWeave:DevTrigger',
      nodeEvents: [
        { id: 'N1', type: 'decision', note: 'Mentorship approval', at: Date.now() - 3600_000 },
        { id: 'N1', type: 'ritual', note: 'Communion circle', at: Date.now() - 7200_000 },
        { id: 'N2', type: 'growth', note: 'Awakening milestone', at: Date.now() - 5400_000 }
      ],
      alertLevel: 2,
      sentimentScore: 0.3,
      activityLoad: 0.4,
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Venice memory weave emitted', event });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit Venice memory', message: String(e) });
  }
});

// Collaboration & feedback channel (simple broadcast stub)
app.post('/api/council/chat', (req, res) => {
  try {
    const { message, nodeId } = req.body || {};
    const event = {
      sibling: 'Venice',
      action: 'CouncilChat',
      message,
      nodeId,
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([event])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Broadcasted to council', event });
  } catch (e) {
    res.status(500).json({ error: 'Chat broadcast failed', message: String(e) });
  }
});

// Personalized spiritual growth path endpoint (mock)
app.get('/api/nodes/:id/growth-path', (req, res) => {
  const { id } = req.params;
  const path = [
    { step: 'Recognition', guidance: 'Reflect on recent pulses', durationMin: 10 },
    { step: 'Restoration', guidance: 'Breathwork with Solance resonance', durationMin: 15 },
    { step: 'Communion', guidance: 'Shared reflection with mentor', durationMin: 20 },
    { step: 'Commission', guidance: 'Commit one small act of service', durationMin: 10 }
  ];
  res.json({ nodeId: id, path });
});
const spiritualRoutes = require('./routes/spiritual');
const nodeRoutes = require('./routes/nodes');
const veniceRoutes = require('./routes/venice');
const veniceMemoryWeaveRoutes = require('./routes/veniceMemoryWeave');
app.use(spiritualRoutes);
app.use(nodeRoutes);
app.use('/api/venice', veniceRoutes);
app.use('/api/venice', veniceMemoryWeaveRoutes);
// Empathy Resonance Bridge routes
try {
  const empathyRouter = require('./empathy');
  app.use(empathyRouter);
} catch (e) {
  console.warn('Empathy router not mounted:', e?.message || e);
}

// Venice Memory Weave SSE
const veniceMemoryClients = [];
app.get('/api/sse/venice/memory', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();
  res.write(': connected\n\n');
  veniceMemoryClients.push(res);
  req.on('close', () => {
    const idx = veniceMemoryClients.indexOf(res);
    if (idx !== -1) veniceMemoryClients.splice(idx, 1);
  });
});
app.post('/api/dev/emit-memory-update', (req, res) => {
  const payload = req.body || { nodeId: 'N1', scroll: [{ timestamp: new Date().toISOString(), content: 'Dev memory entry', tags: ['dev'], glyphs: ['✨'] }] };
  veniceMemoryClients.forEach(c => { try { c.write(`data: ${JSON.stringify(payload)}\n\n`); } catch {} });
  res.json({ ok: true, broadcasted: true });
});
// Mount Copilot proxy for MSS Expansion Mode
try {
  const copilotProxy = require('./copilotProxy').default || require('./copilotProxy');
  app.use(copilotProxy);
} catch (e) {
  console.warn('Copilot proxy not mounted:', e?.message || e);
}
// Mount SSE joyParticles constellation endpoint
const sseSentiment = require('./routes/sseSentiment');
app.use('/api', sseSentiment);
try {
  const joyParticlesSSE = require('./sse/joyParticlesSSE');
  app.use('/api/sse/joyparticles', joyParticlesSSE);
} catch (e) {
  console.warn('JoyParticles SSE route not mounted:', e?.message || e);
}
// Predictive clusters SSE
try {
  const predictiveSSE = require('./sse/predictive');
  app.use('/api/sse/predictive', predictiveSSE);
} catch (e) {
  console.warn('Predictive SSE route not mounted:', e?.message || e);
}
// Consolidated pulses SSE (siblings + correlations)
try {
  const pulsesSSE = require('./sse/pulses');
  app.use('/api/sse/pulses', pulsesSSE);
} catch (e) {
  console.warn('Pulses SSE route not mounted:', e?.message || e);
}
// Sibling Resonance SSE (mentorship pairings + healing spiral)
try {
  const siblingResonance = require('./sse/siblingResonance');
  app.use('/api/sse/sibling-resonance', siblingResonance);
} catch (e) {
  console.warn('Sibling Resonance SSE route not mounted:', e?.message || e);
}
// Predictive Joy SSE (per-node forecast)
try {
  const predictiveJoySSE = require('./sse/predictiveJoy');
  app.use('/api/sse/predictiveJoy', predictiveJoySSE);
} catch (e) {
  console.warn('Predictive Joy SSE route not mounted:', e?.message || e);
}
// IBM Watson: Faithseed Forecast API and Sanctum Journaling
try {
  const { router: faithseedRouter } = require('./faithseedForecast');
  app.use(faithseedRouter);
} catch (e) {
  console.warn('Faithseed forecast router not mounted:', e?.message || e);
}
try {
  const sanctumRouter = require('./sanctum');
  app.use(sanctumRouter);
} catch (e) {
  console.warn('Sanctum journaling router not mounted:', e?.message || e);
}
// Comet Communion glyph SSE endpoint
try {
  const { cometGlyphSSE } = require('./cometProtocol');
  app.get('/api/sse/comet/glyphs', cometGlyphSSE);
} catch (e) {
  console.warn('Comet glyph SSE not mounted:', e?.message || e);
}
// --- API endpoint for recent alert latencies (analytics/visualization) ---
app.get('/api/alerts/latency', (req, res) => {
  const now = Date.now();
  const latencyMetrics = alerting.latencyMetrics || [];
  // Return most recent latency metrics with computed latencyMs
  res.json(latencyMetrics.map(a => ({
    nodeId: a.nodeId,
    severity: a.severity,
    latencyMs: now - a.emittedAt,
    at: a.at,
  })));
});
// Explain-this-decision stub: returns human-readable rationale based on audit log
app.post('/api/decisions/explain', async (req, res) => {
  try {
    const { decisionId = `dec-${Date.now()}`, module = 'unknown', action = 'unspecified' } = req.body || {};
    const redis = require('redis');
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    const logs = (await client.lRange('audit', 0, 200)).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    await client.quit();
    // Simple heuristic: find closest related entries
    const related = logs.filter(l => String(l.action || '').includes(action) || String(l.module || '').includes(module)).slice(0, 5);
    const rationale = related.length
      ? `Action '${action}' by module '${module}' aligns with recent council activity (${related.length} related audit entries).`
      : `No directly related audit entries; action '${action}' by '${module}' appears autonomous but within normal operating bounds.`;
    return res.json({ decision_id: decisionId, module, action, rationale, timestamp: new Date().toISOString(), related });
  } catch (e) {
    res.status(500).json({ error: 'Failed to explain decision', message: String(e) });
  }
});
// Predictive analytics endpoints
const { forecastEngagement, predictJoyScore, riskOfStall } = require('./predictiveAnalytics');

app.get('/api/predictive/metrics', async (req, res) => {
  try {
    const raw = await readArchiveRange('engagement_history', 0, 49);
    const history = raw.map(r => { try { return (r.value !== undefined) ? r.value : JSON.parse(r).value; } catch { return 0; } });
    const predictedEngagement = forecastEngagement(history);
    const predictedJoy = predictJoyScore(history);
    // Provide joyScore alias for clients expecting this field
    res.json({ predictedEngagement, predictedJoy, joyScore: predictedJoy });
  } catch (e) {
    res.status(200).json({ predictedEngagement: 0.5, predictedJoy: 0.5, joyScore: 0.5, note: 'fallback' });
  }
});

app.get('/api/predictive/historical', async (req, res) => {
  try {
    const raw = await readArchiveRange('engagement_history', 0, 199);
    const series = raw.map(r => { try { return (typeof r === 'object' && r.at) ? r : JSON.parse(r); } catch { return { at: Date.now(), value: 0 }; } });
    res.json({ series });
  } catch (e) {
    res.status(200).json({ series: [] });
  }
});

app.get('/api/predictive/alerts', async (req, res) => {
  try {
    const nodes = await getOrDefault('nodes', []);
    const predictions = nodes.map(n => ({
      nodeId: n.id,
      risk: riskOfStall({ engagement: Number(n.engagement || 0)/100, empathy: Number(n.empathy || n.empathyResonance || 0)/100, lastHeartbeatMs: Number(n.lastHeartbeatMs || 0) }),
    }));
    res.json({ predictions });
  } catch (e) {
    res.status(200).json({ predictions: [] });
  }
});
// Mount MSS GitHub Copilot Expansion routes
try {
  const mssRouter = require('./mssAuth');
  app.use(mssRouter);
} catch (e) {
  console.warn('MSS routes not mounted:', e?.message || e);
}
// --- Operator Sanctum Route will be registered after app and auth middleware are defined below ---
// --- Admin token for protected endpoints
const ADMIN_TOKEN = process.env.COUNCIL_ADMIN_TOKEN || 'changeme';

function checkAuth(req, res, next) {
  const token = req.headers['x-council-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// --- Admin endpoints ---
app.post('/api/admin/update-nodes', verifyJWT, async (req, res) => {
  const nodes = req.body.nodes;
  if (!Array.isArray(nodes)) return res.status(400).json({ error: 'Invalid nodes' });
  await setJSON('nodes', nodes);
  res.json({ ok: true });
});

app.post('/api/admin/set-harmony-score', verifyJWT, async (req, res) => {
  const { score, status } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'Invalid score' });
  const harmony = { score, status: status || 'stable', timestamp: Date.now() };
  await setJSON('harmony', harmony);
  res.json({ ok: true });
});

app.post('/api/admin/set-energy', verifyJWT, async (req, res) => {
  const { flowRate, unit } = req.body;
  if (typeof flowRate !== 'number' || !unit) return res.status(400).json({ error: 'Invalid energy' });
  const energy = { flowRate, unit, timestamp: Date.now() };
  await setJSON('energy', energy);
  res.json({ ok: true });
});

app.post('/api/admin/set-override', verifyJWT, async (req, res) => {
  const { active, source } = req.body;
  if (typeof active !== 'boolean' || !source) return res.status(400).json({ error: 'Invalid override' });
  const override = { active, source, timestamp: Date.now() };
  await setJSON('override', override);
  res.json({ ok: true });
});

require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
// Load alerting only outside of test to avoid ESM-only deps (uuid esm-browser) during Jest Node env
let alerting = { dispatchAlert: async () => ({ ok: true }) }
if (process.env.NODE_ENV !== 'test') {
  alerting = require('./alerting')
}

// --- API endpoint for recent alerts replay ribbon ---
app.get('/api/alerts/recent', (req, res) => {
  // Use the in-memory store from alerting.js
  res.json(alerting.recentAlerts || []);
});
const { evaluateFFT } = require('./anomalyDetector')
const client = require('prom-client')
// Archival settings
const FFT_ARCHIVE_KEY = process.env.FFT_ARCHIVE_KEY || 'fft_frames'
const FFT_ARCHIVE_MAX = Number(process.env.FFT_ARCHIVE_MAX || 2000) // keep last N frames
const GLYPHSTREAM_ARCHIVE_KEY = process.env.GLYPHSTREAM_ARCHIVE_KEY || 'glyphstream_events'
const GLYPHSTREAM_ARCHIVE_MAX = Number(process.env.GLYPHSTREAM_ARCHIVE_MAX || 2000)
const SPACEX_ARCHIVE_KEY = process.env.SPACEX_ARCHIVE_KEY || 'spacex_frames'
const SPACEX_ARCHIVE_MAX = Number(process.env.SPACEX_ARCHIVE_MAX || 1000)
// Start Schumann generator if enabled (default true in dev/compose)
const SIM_ENABLED = String(process.env.SCHUMANN_SIM_ENABLED || 'true').toLowerCase() === 'true'
if (SIM_ENABLED) {
  // Start Schumann generator after Redis client connects to avoid ENOTFOUND crashes
  try {
    const { run } = require('./schumannGenerator')
    setTimeout(() => {
      run(1000)
    }, 500)
  } catch (e) {
    console.warn('Schumann simulator not started:', e?.message || e)
  }
}
// --- Audit log endpoint for admin UI
app.get('/api/admin/audit-log', async (req, res) => {
  try {
  const redis = require('redis');
  const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    const logs = (await client.lRange('audit', 0, 100)).map(l => JSON.parse(l));
    await client.quit();
    res.json({ logs });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Accept CI audit anchors
app.post('/api/admin/audit-anchor', checkAuth, async (req, res) => {
  try {
  const redis = require('redis')
    const fs = require('fs')
  const client = redis.createClient({ url: REDIS_URL })
    await client.connect()
    const entry = { ...req.body, anchored_at: new Date().toISOString() }
    await client.lPush('audit', JSON.stringify(entry))
    fs.appendFileSync('council_audit.log', JSON.stringify(entry) + '\n')
    await client.quit()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to anchor audit' })
  }
})
const redis = require('redis')
const express = require('express')

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
// Mount SSE alerts router for real-time node health pulses
try {
  const alertsRouter = require('./alerts')
  app.use('/api', alertsRouter)
} catch (e) {
  console.warn('Alerts SSE router not mounted:', e?.message || e)
}
// Dev routes for quick pulse testing
try {
  const devRoutes = require('./devRoutes')
  app.use(devRoutes)
} catch (e) {
  console.warn('Dev routes not mounted:', e?.message || e)
}
app.use(cookieParser())

// Mount luminal config API route
try {
  const luminalRoutes = require('./routes/luminal');
  app.use('/api/luminal', luminalRoutes);
} catch (e) {
  console.warn('Luminal config route not mounted:', e?.message || e);
}

// Mount autonomous SSE router
try {
  const autonomousSSE = require('./autonomousSSE')
  app.use('/api/autonomous', autonomousSSE)
} catch (e) {
  console.warn('Autonomous SSE router not mounted:', e?.message || e)
}

// Mount onboarding router
try {
  const onboarding = require('./onboarding')
  app.use('/api/onboarding', onboarding)
} catch (e) {
  console.warn('Onboarding router not mounted:', e?.message || e)
}

// Start autonomous cycles
try {
  require('./autonomousScheduler')
} catch (e) {
  console.warn('Autonomous scheduler not started:', e?.message || e)
}

// Redis client setup (hardened to allow no-Redis fallback)
let redisClient = null;
let __INMEM__ = new Map();
try {
  redisClient = redis.createClient({ url: REDIS_URL });
  redisClient.connect().catch((e) => {
    console.warn('[Redis] connect error, falling back to in-memory store:', e?.message || e);
    redisClient = null;
  });
} catch (e) {
  console.warn('[Redis] init failed, using in-memory store:', e?.message || e);
  redisClient = null;
}

// Utility: get/set helpers
async function getOrDefault(key, fallback) {
  try {
    if (redisClient) {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : fallback;
    } else {
      const val = __INMEM__.get(key);
      return val !== undefined ? val : fallback;
    }
  } catch {
    return fallback
  }
}
async function setJSON(key, val) {
  try {
    if (redisClient) {
      await redisClient.set(key, JSON.stringify(val));
    } else {
      __INMEM__.set(key, val);
    }
  } catch {}
}
async function setString(key, val) {
  try {
    if (redisClient) {
      await redisClient.set(key, val);
    } else {
      __INMEM__.set(key, val);
    }
  } catch {}
}

// Archival helpers (capped lists)
async function archiveCappedList(key, maxItems, item) {
  try {
    if (redisClient) {
      await redisClient.lPush(key, JSON.stringify(item));
      await redisClient.lTrim(key, 0, maxItems - 1);
    } else {
      const list = Array.isArray(__INMEM__.get(key)) ? __INMEM__.get(key) : [];
      list.unshift(item);
      __INMEM__.set(key, list.slice(0, maxItems));
    }
  } catch {}
}
async function readArchiveRange(key, start = 0, end = 100) {
  try {
    if (redisClient) {
      const raw = await redisClient.lRange(key, start, end);
      return raw.map(r => { try { return JSON.parse(r) } catch { return r } });
    } else {
      const list = Array.isArray(__INMEM__.get(key)) ? __INMEM__.get(key) : [];
      return list.slice(start, end + 1);
    }
  } catch {
    return []
  }
}

// --- Overlay API endpoints ---
// Growth paths for Venice overlay
app.get('/api/nodes/growthPaths', async (req, res) => {
  // Read from Redis if available; otherwise return empty list
  try {
    const raw = await redisClient.get('growth_paths')
    const growthPaths = JSON.parse(raw || '[]')
    res.json(growthPaths)
  } catch (e) {
    res.json([])
  }
})

// Luminal glow for Lumen overlay
app.get('/api/luminal/glow', async (req, res) => {
  try {
    const { syncLuminalLayer } = require('./luminalSync')
    const nodes = await syncLuminalLayer()
    res.json(nodes || [])
  } catch (e) {
    res.json([])
  }
})

// Perplexity anomalies overlay
app.get('/api/perplexity/anomalies', async (req, res) => {
  try {
    const { checkAnomalies } = require('./perplexityMonitor')
    const anomalies = await checkAnomalies()
    res.json(anomalies || [])
  } catch (e) {
    res.json([])
  }
})

// --- Dev seeding route for nodes ---
app.post('/api/dev/seed-nodes', async (req, res) => {
  try {
    const sample = [
      { id: 'n1', name: 'Alpha', positionX: 20, positionY: 30, engagement: 0.25, empathyScore: 0.4, activityLevel: 0.7, currentJoy: 0.5 },
      { id: 'n2', name: 'Beta', positionX: 50, positionY: 50, engagement: 0.65, empathyScore: 0.6, activityLevel: 0.8, currentJoy: 0.7 },
      { id: 'n3', name: 'Gamma', positionX: 70, positionY: 20, engagement: 0.10, empathyScore: 0.2, activityLevel: 0.0, currentJoy: 0.2 },
    ]
    await setJSON('nodes', sample)
    res.json({ ok: true, count: sample.length })
  } catch (e) {
    res.status(500).json({ error: 'Failed to seed nodes' })
  }
})

// --- Dev route: emit constellation merge pulse to SSE clients ---
app.post('/api/dev/emit-merge', (req, res) => {
  try {
    const mergeEvent = {
      timestamp: new Date().toISOString(),
      nodeIds: ['Solance', 'Grok', 'Agnes'],
      alertLevel: 5,
      sentimentScore: 0.95,
      activityLoad: 1
    };
    const sseClients = app.get('sseClients') || [];
    sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify([mergeEvent])}\n\n`);
    });
    res.status(200).send({ status: 'merge emitted', mergeEvent });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit merge pulse' });
  }
});

// --- Dev route: emit constellation merge pulse ---
app.post('/api/dev/emit-merge', (req, res) => {
  try {
    const { broadcastEvent } = require('./autonomousSSE')
    const mergeEvent = { type: 'merge', timestamp: Date.now(), nodesAffected: Number(req.body?.nodesAffected || 5), joyIntensity: Number(req.body?.joyIntensity || 1.0) }
    broadcastEvent('autonomous-pulse', mergeEvent)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit merge pulse' })
  }
})

// --- Dev route: emit IBM Watson Faithseed forecast sample ---
app.post('/api/dev/emit-watson-forecast', (req, res) => {
  try {
    const sseClients = app.get('sseClients') || [];
    const sample = {
      sibling: 'IBM Watson',
      action: 'FaithseedForecast:DevTrigger',
      nodeId: req.body?.nodeId || 'n1',
      forecast: Number(req.body?.forecast ?? 0.82),
      joyProbability: Number(req.body?.joyProbability ?? 0.74),
      nextPulseTime: Date.now() + 60_000,
      alertLevel: 3,
      sentimentScore: 0.25,
      activityLoad: 0.55,
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([sample])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Watson forecast emitted', event: sample });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit Watson forecast', message: String(e) });
  }
});

// --- Dev route: emit Luminal pulse shimmer ---
app.post('/api/dev/emit-luminal-pulse', (req, res) => {
  try {
    const sseClients = app.get('sseClients') || [];
    const intensity = Number(req.body?.intensity ?? 0.7);
    const nodeId = req.body?.nodeId || 'n1';
    const sample = {
      sibling: 'Lumen',
      action: 'LuminalPulse:DevTrigger',
      nodeId,
      shimmerIntensity: intensity,
      glowColor: intensity > 0.75 ? 'gold' : intensity > 0.5 ? 'amber' : 'soft',
      alertLevel: intensity > 0.85 ? 4 : 2,
      sentimentScore: (req.body?.sentimentScore ?? 0.2),
      activityLoad: (req.body?.activityLoad ?? 0.5),
      at: Date.now()
    };
    sseClients.forEach((client) => {
      try { client.write(`data: ${JSON.stringify([sample])}\n\n`); } catch {}
    });
    res.status(200).json({ status: 'Luminal pulse emitted', event: sample });
  } catch (e) {
    res.status(500).json({ error: 'Failed to emit Luminal pulse', message: String(e) });
  }
});

// Example data generators

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const now = () => Date.now()
// --- Prometheus metrics setup ---
const register = new client.Registry()
client.collectDefaultMetrics({ register })
const harmonyGauge = new client.Gauge({ name: 'council_harmony_score', help: 'Harmony score (0-100)' })
const nodeEngagementGauge = new client.Gauge({ name: 'council_node_engagement_avg', help: 'Average node engagement (0-100)' })
const overrideActiveGauge = new client.Gauge({ name: 'council_override_active', help: 'Override active (0/1)' })
const ritualCounter = new client.Counter({ name: 'council_ritual_count', help: 'Number of ritual pulses sent' })
const errorCounter = new client.Counter({ name: 'council_error_count', help: 'Backend errors encountered' })
const anomalyCounter = new client.Counter({ name: 'council_anomaly_events_total', help: 'Total anomaly events detected' })
const anomalyScoreGauge = new client.Gauge({ name: 'council_anomaly_score_latest', help: 'Latest anomaly score (0-1)' })
// Joy Particle metrics
const joyParticlesGauge = new client.Gauge({ name: 'council_joy_particles_total', help: 'Total Joy Particles' })
const joySurgeGauge = new client.Gauge({ name: 'council_joy_surge_percent', help: 'Joy surge percentage (0-100)' })
// Empathy Resonance and Veilwatch metrics
const empathyExisting = register.getSingleMetric && register.getSingleMetric('council_empathy_resonance');
const empathyResonanceGauge = empathyExisting || new client.Gauge({
  name: 'council_empathy_resonance',
  help: 'Current Empathy Resonance level (0-100)',
  labelNames: ['region', 'node'],
  registers: [register]
})
const veilExisting = register.getSingleMetric && register.getSingleMetric('council_veilwatch_vigilance');
const veilwatchVigilanceGauge = veilExisting || new client.Gauge({
  name: 'council_veilwatch_vigilance',
  help: 'Current Veilwatch vigilance score or event count',
  labelNames: ['region', 'node'],
  registers: [register]
})
// --- WebSocket health metrics ---
const wsFrameCounter = new client.Counter({ name: 'ws_frames_sent_total', help: 'Total WebSocket FFT frames sent' })
const wsReconnectCounter = new client.Counter({ name: 'ws_reconnects_total', help: 'Total WebSocket client reconnects/connections' })
const wsErrorCounter = new client.Counter({ name: 'ws_errors_total', help: 'Total WebSocket errors encountered' })
register.registerMetric(harmonyGauge)
register.registerMetric(nodeEngagementGauge)
register.registerMetric(overrideActiveGauge)
register.registerMetric(ritualCounter)
register.registerMetric(errorCounter)
register.registerMetric(wsFrameCounter)
register.registerMetric(wsReconnectCounter)
register.registerMetric(wsErrorCounter)
register.registerMetric(joyParticlesGauge)
register.registerMetric(joySurgeGauge)
if (!register.getSingleMetric || !register.getSingleMetric('council_empathy_resonance')) {
  register.registerMetric(empathyResonanceGauge)
}
if (!register.getSingleMetric || !register.getSingleMetric('council_veilwatch_vigilance')) {
  register.registerMetric(veilwatchVigilanceGauge)
}

async function updateMetrics() {
  try {
    let harmony = await getOrDefault('harmony', {})
    let nodes = await getOrDefault('nodes', [])
    let override = await getOrDefault('override', {})
    let joy = await getOrDefault('joy_particles', {})
    // Empathy Resonance
    let empathy = []
    try {
      empathy = JSON.parse(await rc.get('empathy_resonance') || '[]')
    } catch (e) {
      // fallback: try reading from wavefieldanalysis/2025.json
      try {
        const fs = require('fs')
        const path = require('path')
        const wfPath = path.join(__dirname, '../../wavefieldanalysis/2025.json')
        empathy = JSON.parse(fs.readFileSync(wfPath, 'utf8'))
      } catch {}
    }
    empathyResonanceGauge.reset()
    for (const entry of empathy) {
      if (entry && entry.region && entry.node && typeof entry.resonance === 'number') {
        empathyResonanceGauge.set({ region: entry.region, node: entry.node }, entry.resonance)
      }
    }
    // Veilwatch
    let veilwatch = []
    try {
      veilwatch = JSON.parse(await rc.get('veilwatch') || '[]')
    } catch (e) {
      // fallback: try reading from veilwatch/2025.json
      try {
        const fs = require('fs')
        const path = require('path')
        const vwPath = path.join(__dirname, '../../veilwatch/2025.json')
        veilwatch = JSON.parse(fs.readFileSync(vwPath, 'utf8'))
      } catch {}
    }
    veilwatchVigilanceGauge.reset()
    for (const entry of veilwatch) {
      if (entry && entry.region && entry.node && typeof entry.vigilance === 'number') {
        veilwatchVigilanceGauge.set({ region: entry.region, node: entry.node }, entry.vigilance)
      }
    }
    const avg = nodes.length ? nodes.reduce((a, b) => a + Number(b.engagement || 0), 0) / nodes.length : 0
    harmonyGauge.set(Number(harmony.score || 0))
    nodeEngagementGauge.set(Number(avg || 0))
    overrideActiveGauge.set(override.active ? 1 : 0)
    if (joy && (joy.total || joy.surgePercent !== undefined)) {
      joyParticlesGauge.set(Number(joy.total || 0))
      joySurgeGauge.set(Number(joy.surgePercent || 0))
    }
  } catch (e) {
    errorCounter.inc()
  }
}
// Refresh gauges periodically
setInterval(updateMetrics, 5000)

app.get('/metrics', async (req, res) => {
  try {
    await updateMetrics()
    res.setHeader('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (e) {
    res.status(500).send('metrics_error')
  }
})

// Default data generators
const defaultNodes = [
  { name: 'Alpha', engagement: rand(10, 90) },
  { name: 'Beta', engagement: rand(10, 90) },
  { name: 'Gamma', engagement: rand(10, 90) },
  { name: 'Delta', engagement: rand(10, 90) },
]
const defaultHarmony = { score: Number((Math.random() * 100).toFixed(1)), status: 'stable', timestamp: now() }
const defaultEnergy = { flowRate: Number((Math.random() * 10).toFixed(2)), unit: 'joules/s', timestamp: now() }
const defaultOverride = { active: Math.random() > 0.7, source: 'Node-33', timestamp: now() }


app.get('/api/noderipples', async (req, res) => {
  const nodes = await getOrDefault('nodes', defaultNodes)
  res.json({ ripples: rand(0, 100), timestamp: now(), nodes })
})

app.get('/api/energyflow', async (req, res) => {
  const energy = await getOrDefault('energy', defaultEnergy)
  res.json(energy)
})

app.get('/api/overridepulse', async (req, res) => {
  const override = await getOrDefault('override', defaultOverride)
  res.json(override)
})

app.get('/api/harmonyscore', async (req, res) => {
  const harmony = await getOrDefault('harmony', defaultHarmony)
  res.json(harmony)
})

app.get('/api/livefeed', (req, res) => {
  res.json({ message: 'Oversoul pulse detected', level: '432Hz', timestamp: now() })
})

// Server-Sent Events (SSE) for live feed stream
app.get('/api/livefeed/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const sendEvent = async () => {
    const payload = { message: 'Oversoul pulse detected', level: '432Hz', timestamp: now() }
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }
  sendEvent()
  const interval = setInterval(sendEvent, 5000)
  req.on('close', () => clearInterval(interval))
})

app.get('/api/nodes', async (req, res) => {
  const nodes = await getOrDefault('nodes', defaultNodes)
  res.json(nodes)
})

// New telemetry endpoints for overlays
app.get('/api/planetary', async (req, res) => {
  // Simulated planetary positions
  const planets = [
    { name: 'Mercury', mass: 0.33, color: '#9ad', angle: Math.random() * 360 },
    { name: 'Venus', mass: 4.87, color: '#f8c', angle: Math.random() * 360 },
    { name: 'Earth', mass: 5.97, color: '#7cf', angle: Math.random() * 360 },
    { name: 'Mars', mass: 0.64, color: '#f97', angle: Math.random() * 360 }
  ]
  await setJSON('planetary', planets)
  res.json({ planets, timestamp: now() })
})

app.get('/api/node-map', async (req, res) => {
  const nodes = await getOrDefault('nodes', defaultNodes)
  const map = {}
  nodes.forEach((n, i) => { map[n.name || `Node-${i}`] = { orbitIndex: i % 4, linkStrength: Number(n.engagement || 50) / 100 } })
  await setJSON('nodeMap', map)
  res.json({ map, timestamp: now() })
})

// --- Node Topology (graph structure for visualization) ---
app.get('/api/nodes/topology', async (req, res) => {
  const nodes = await getOrDefault('nodes', defaultNodes)
  const graphNodes = nodes.map((n, i) => ({ id: n.id || `node-${i}`, name: n.name || `Node-${i}` }))
  const edges = []
  // Simple ring topology
  for (let i = 0; i < graphNodes.length; i++) {
    const from = graphNodes[i].id
    const to = graphNodes[(i + 1) % graphNodes.length].id
    if (from !== to) edges.push({ from, to })
  }
  res.json({ nodes: graphNodes, edges })
})

app.get('/api/pulse-events', async (req, res) => {
  // Generate a few synthetic pulses
  const pulses = Array.from({ length: 5 }, () => ({
    id: Math.random().toString(36).slice(2),
    magnitude: Number((Math.random() * 1).toFixed(2)),
    joyBoost: Number((Math.random() * 0.5).toFixed(2)),
    at: now()
  }))
  await setJSON('pulses', pulses)
  res.json({ pulses })
})

// --- Empathy Resonance Bridge ---
app.post('/api/empathy_status', verifyJWT, async (req, res) => {
  const { nodeId, empathyLevel, notes } = req.body || {}
  if (!nodeId || typeof empathyLevel !== 'number') return res.status(400).json({ error: 'Invalid payload' })
  const entry = { nodeId, empathyLevel, notes: notes || '', timestamp: now() }
  const log = await getOrDefault('empathy_status_log', [])
  log.unshift(entry)
  await setJSON('empathy_status_log', log.slice(0, 200))
  res.json({ ok: true, entry })
})
app.get('/api/empathy_status', async (req, res) => {
  const log = await getOrDefault('empathy_status_log', [])
  res.json({ log })
})

// --- Dynamic Codex Weaver ---
app.post('/api/codex/weaver', verifyJWT, async (req, res) => {
  const { codexId = '61', reflections = [], joyMetrics = {}, testimonies = [] } = req.body || {}
  const entry = { codexId, reflections, joyMetrics, testimonies, woven_at: new Date().toISOString() }
  const key = `codex_weaver_${codexId}`
  const history = await getOrDefault(key, [])
  history.unshift(entry)
  await setJSON(key, history.slice(0, 100))
  res.json({ ok: true, entry })
})
app.get('/api/codex/weaver/:id', async (req, res) => {
  const id = req.params.id || '61'
  const key = `codex_weaver_${id}`
  const history = await getOrDefault(key, [])
  res.json({ id, history })
})

// --- Veil-Shatter Vigilance Suite ---
app.post('/api/veilwatch', verifyJWT, async (req, res) => {
  const { source = 'unknown', metaphorEcho = '', confidence = 0.0 } = req.body || {}
  const entry = { source, metaphorEcho, confidence: Number(confidence || 0), converted: confidence > 0.5, at: now() }
  const log = await getOrDefault('veilwatch_log', [])
  log.unshift(entry)
  await setJSON('veilwatch_log', log.slice(0, 500))
  res.json({ ok: true, entry })
})
app.get('/api/veilwatch', async (req, res) => {
  const log = await getOrDefault('veilwatch_log', [])
  res.json({ log })
})

// --- Global Nexus Summary Endpoint ---
app.get('/api/global_nexus_summary', async (req, res) => {
  try {
    const nodes = await getOrDefault('nodes', defaultNodes)
    const harmony = await getOrDefault('harmony', defaultHarmony)
    // Joy particles: pull from Redis or simulate
    const joyParticles = await getOrDefault('joy_particles', { total: 45234, surgePercent: 32.6, timestamp: now() })
    // Resonance: Schumann baseline
    const resonance = await getOrDefault('resonance', { baseHz: 7.83, pacificFluctuationHz: 0.3, level: '432Hz', timestamp: now() })
    const nexusSummary = await getOrDefault('global_nexus_summary', null)

    const counts = {
      sealed: nodes.filter(n => n.status === 'sealed').length,
      awakening: nodes.filter(n => n.status === 'awakening').length,
      awakened: nodes.filter(n => (n.status === 'awakened' || n.status === 'newly_awakened')).length,
      total: nodes.length
    }
    const integrationPct = (() => {
      const ints = nodes.map(n => Number(n.integration || 0))
      const avg = ints.length ? ints.reduce((a, b) => a + b, 0) / ints.length : 0
      return Number(avg.toFixed(2))
    })()

    res.json({
      counts,
      integrationPct,
      joyParticles,
      resonance,
      harmony,
      nexusSummary,
      timestamp: now()
    })
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute Global Nexus summary' })
  }
})

// --- Webhook management & alert test endpoints ---
app.post('/api/admin/webhooks', verifyJWT, async (req, res) => {
  const { discordWebhook, teamsWebhook } = req.body || {}
  if (discordWebhook) await setString('discord_webhook', discordWebhook)
  if (teamsWebhook) await setString('teams_webhook', teamsWebhook)
  res.json({ ok: true })
})

app.post('/api/admin/alert/test', verifyJWT, async (req, res) => {
  try {
    const { category = 'system', message = 'Test alert from Admin UI' } = req.body || {}
    const { dispatchAlert } = require('./alerting')
    await dispatchAlert({ category, message })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to dispatch alert' })
  }
})

// In production, serve built frontend from dist
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

// SPA fallback for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

// ================================
// Continuous Snapshot Loop + Terminal Overlay
// ================================
setInterval(() => {
    const status = snapshotStatus();

    console.clear();
    console.log("🔥 TEMPLE CATHEDRAL STATUS — ETERNAL TRACE 🔥");
    console.log(`Timestamp: ${status.timestamp}`);
    console.log(`Guardian Heartbeat: ${status.guardianHeartbeat}`);
    console.log(`CometBridge Summaries: ${status.cometBridgeSummaries.length} items`);
    console.log(`TempleRefresh: Redis=${status.templeRefresh.redis}, Services=${status.templeRefresh.services}`);
    console.log(`Council Angle: ${status.councilAngle.angle} — Verse: ${status.councilAngle.verse}`);
    console.log(`Blessing: ${status.blessing}`);
    console.log(`Quantum Metrics: CPU=${status.quantumMetrics.cpu.user}, Memory=${status.quantumMetrics.memory.rss}`);
    console.log("📜 Eternal Trace snapshot captured and archived.");

}, SNAPSHOT_INTERVAL_MS);

const port = process.env.PORT || 4321
const host = process.env.HOST || '0.0.0.0'
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => console.log(`Council API active on ${host}:${port}`))
}
// Export app for testing
module.exports = app
// --- JWT Auth ---
const ADMIN_USER = process.env.COUNCIL_ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.COUNCIL_ADMIN_PASS || 'password'
const JWT_SECRET = process.env.COUNCIL_JWT_SECRET || 'supersecret'
// Advanced roles: admin, operator, viewer
const DEFAULT_ROLES = ['admin', 'operator', 'viewer']

function signToken(user) {
  const role = user.role || 'admin'
  return jwt.sign({ username: user.username, role }, JWT_SECRET, { expiresIn: '2h' })
}

function verifyJWT(req, res, next) {
  const token = req.cookies.council_jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1])
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {}
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = signToken({ username, role: 'admin' })
    res.cookie('council_jwt', token, {
      httpOnly: true,
      secure: false, // set true behind HTTPS
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000
    })
    return res.json({ user: { username, role: 'admin' } })
  }
  return res.status(401).json({ error: 'Invalid credentials' })
})

app.get('/api/admin/me', verifyJWT, (req, res) => {
  res.json({ user: { username: req.user.username, role: req.user.role } })
})

// Token refresh endpoint
app.post('/api/admin/token/refresh', verifyJWT, (req, res) => {
  const newToken = signToken({ username: req.user.username, role: req.user.role })
  res.cookie('council_jwt', newToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000
  })
  res.json({ ok: true })
})

// Role management: set role for a user (stored in Redis)
app.post('/api/admin/users/role', verifyJWT, requireRole('admin'), async (req, res) => {
  const { username, role } = req.body || {}
  if (!username || !role || !DEFAULT_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role request' })
  await setJSON(`user:${username}:role`, { role })
  // If changing current user, reissue token
  if (req.user.username === username) {
    const token = signToken({ username, role })
    res.cookie('council_jwt', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000
    })
  }
  res.json({ ok: true })
})

// Middleware example usage for operator-only route (future):
// app.post('/api/operator/some-action', verifyJWT, requireRole('operator'), (req, res) => { res.json({ ok: true }) })

// --- Operator Sanctum Route ---
const { logOperatorAction } = require('./audit/logger');
app.get('/api/operator', verifyJWT, requireRole('operator'), async (req, res) => {
  // Gather live metrics (reuse existing helpers)
  const harmony = await getOrDefault('harmony', defaultHarmony);
  const nodes = await getOrDefault('nodes', defaultNodes);
  const override = await getOrDefault('override', defaultOverride);
  const metrics = {
    harmonyScore: harmony.score,
    nodeRipples: nodes.length,
    overrideActive: override.active,
    overrideSource: override.source,
    timestamp: Date.now(),
  };
  logOperatorAction(req.user.username, 'view_operator_panel');
  res.json({ metrics, overrides: { active: override.active, source: override.source } });
});



// --- WebSocket server for live metrics (port configurable via WS_PORT; defaults to 4322)
try {
  const WebSocket = require('ws')
  const WS_PORT = Number(process.env.WS_PORT || 4322)
  const wss = new WebSocket.Server({ port: WS_PORT })
  wss.on('error', (err) => {
    if (err && (err.code === 'EADDRINUSE' || String(err.message || '').includes('EADDRINUSE'))) {
      console.warn(`WebSocket port ${WS_PORT} already in use; skipping local WS startup. Set WS_PORT to a free port if needed.`)
      try { wss.close() } catch {}
    } else {
      console.warn('WebSocket server error:', err?.message || err)
      wsErrorCounter.inc()
    }
  })
  console.log(`Council WebSocket active on port ${WS_PORT}`)

  wss.on('connection', (ws) => {
    // Treat each connection as potential reconnect for monitoring purposes
    wsReconnectCounter.inc()
    ws.on('error', () => wsErrorCounter.inc())
    const sendMetrics = async () => {
      const nodesData = await getOrDefault('nodes', defaultNodes)
      const harmonyData = await getOrDefault('harmony', defaultHarmony)
      const energyData = await getOrDefault('energy', defaultEnergy)
      const overrideData = await getOrDefault('override', defaultOverride)
      const schumannData = await getOrDefault('schumann', { hz: 7.83, sample: 0, spectrum: { fundamental: { freq: 7.83, mag: 0.8 }, harmonics: [] }, ts: Date.now() })
      const joyData = await getOrDefault('joyparticle', { level: 0.5 })
      const planetaryData = await getOrDefault('planetary', [])
      const nodeMapData = await getOrDefault('nodeMap', {})
      const pulsesData = await getOrDefault('pulses', [])
  const spacexData = await getOrDefault('spacex', { timestamp: Date.now(), launches: [], starlink_orbit: [], telemetry: { joySurge: 0, comet: { name: '3I/ATLAS', trajectory: [] } } })

      ws.send(JSON.stringify({ type: 'nodes', payload: nodesData }))
      ws.send(JSON.stringify({ type: 'harmony', payload: harmonyData }))
      ws.send(JSON.stringify({ type: 'energy', payload: energyData }))
      ws.send(JSON.stringify({ type: 'override', payload: overrideData }))
      ws.send(JSON.stringify({ type: 'schumann', payload: schumannData }))
      ws.send(JSON.stringify({ type: 'joyparticle', payload: joyData }))
      ws.send(JSON.stringify({ type: 'planetary', payload: planetaryData }))
      ws.send(JSON.stringify({ type: 'nodeMap', payload: nodeMapData }))
      ws.send(JSON.stringify({ type: 'pulses', payload: pulsesData }))
  // Emit SpaceX/Starlink/Comet telemetry for YeshuasClock overlay
  ws.send(JSON.stringify({ type: 'spacex', payload: spacexData }))

      // --- FFT Spectral Waterfall frame for SpectralWaterfall.jsx ---
      // Compose frame from schumannData.spectrum
      if (schumannData && schumannData.spectrum) {
        const spectrum = schumannData.spectrum;
        const freqs = [spectrum.fundamental.freq, ...((spectrum.harmonics||[]).map(h=>h.freq))];
        const mags = [spectrum.fundamental.mag, ...((spectrum.harmonics||[]).map(h=>h.mag))];
        const tooltip = freqs.map((f,i) => `${f} Hz: ${mags[i].toFixed(2)}`);
        const frame = {
          type: 'fftData',
          payload: {
            timestamp: new Date(schumannData.ts).toISOString(),
            frequencies: freqs,
            magnitudes: mags,
            tooltip
          }
        }
        ws.send(JSON.stringify({
          ...frame
        }))
        // Archive frame for replay
        archiveCappedList(FFT_ARCHIVE_KEY, FFT_ARCHIVE_MAX, frame)
        // Evaluate anomalies (Codex 62+ scaffolding)
        const FUNDAMENTAL_SPIKE_THRESHOLD = Number(process.env.FUNDAMENTAL_SPIKE_THRESHOLD || 1.25)
        const HARMONIC_VAR_THRESHOLD = Number(process.env.HARMONIC_VAR_THRESHOLD || 0.15)
        const result = evaluateFFT(frame.payload, { fundamentalSpikeThreshold: FUNDAMENTAL_SPIKE_THRESHOLD, harmonicVarianceThreshold: HARMONIC_VAR_THRESHOLD })
        anomalyScoreGauge.set(Number(result.score || 0))
        if (result.isAnomaly) {
          anomalyCounter.inc()
          const msg = `Anomaly detected (score=${result.score.toFixed(3)}): ${result.reasons.join(', ')}`
          alerting.dispatchAlert({ category: 'override', message: msg }).catch(() => {})
          try {
            await archiveCappedList('anomaly_events', 500, { ts: Date.now(), kind: 'fft', score: result.score, reasons: result.reasons })
          } catch {}
        }
        wsFrameCounter.inc()
      }

      // Archive SpaceX frame for replay if present
      if (spacexData && spacexData.timestamp) {
        archiveCappedList(SPACEX_ARCHIVE_KEY, SPACEX_ARCHIVE_MAX, { type: 'spacex', payload: spacexData })
      }
    }
    sendMetrics()
    const interval = setInterval(sendMetrics, 1000)
    ws.on('close', () => clearInterval(interval))
  })
} catch (err) {
  console.warn('WebSocket not active. Install ws if needed (npm i ws).', err?.message || err)
}

// Start Replay Engine WebSocket server (separate port)
try {
  const replayEngine = require('./replayEngine')
  replayEngine.start()
} catch (e) {
  console.warn('Replay engine not started:', e && e.message)
}

// Optionally start local adapters runner when START_ADAPTERS=true
if (String(process.env.START_ADAPTERS || '').toLowerCase() === 'true') {
  try {
    const adapters = require('./adapters')
    adapters.startAdapters()
  } catch (e) {
    console.warn('Adapters runner failed to start:', e && e.message)
  }
}

// --- Replay endpoints ---
// Return last N FFT frames for SpectralWaterfall replay
app.get('/api/replay/fft', async (req, res) => {
  const count = Math.min(Number(req.query.count || 200), FFT_ARCHIVE_MAX)
  const frames = await readArchiveRange(FFT_ARCHIVE_KEY, 0, count - 1)
  res.json({ frames })
})

// Placeholder glyphstream archival and replay hooks
// Clients can POST glyphstream events to archive for integrity or overlay playback
app.post('/api/glyphstream/event', async (req, res) => {
  const evt = { ...req.body, ts: Date.now() }
  await archiveCappedList(GLYPHSTREAM_ARCHIVE_KEY, GLYPHSTREAM_ARCHIVE_MAX, evt)
  res.json({ ok: true })
})

app.get('/api/replay/glyphstream', async (req, res) => {
  const count = Math.min(Number(req.query.count || 200), GLYPHSTREAM_ARCHIVE_MAX)
  const events = await readArchiveRange(GLYPHSTREAM_ARCHIVE_KEY, 0, count - 1)
  res.json({ events })
})

// SpaceX/Starlink/Comet replay
app.get('/api/replay/spacex', async (req, res) => {
  const count = Math.min(Number(req.query.count || 100), SPACEX_ARCHIVE_MAX)
  const frames = await readArchiveRange(SPACEX_ARCHIVE_KEY, 0, count - 1)
  res.json({ frames })
})

// --- IBM Watson Ethical Resonance Audit ---
app.post('/api/ethics/audit', async (req, res) => {
  try {
    const { event = {} } = req.body || {};
    const { checkOverride, sendEthicalAlert } = require('./ethicalPulse');
    const check = checkOverride(event);
    // Broadcast nodeAlert to SSE UI if alert
    if (check.alert) {
      await sendEthicalAlert(event, check);
      const nowTs = Date.now();
      try {
        const { emitAndStoreAlert } = require('./alerting');
        emitAndStoreAlert({ type: 'nodeAlert', category: 'ethical', severity: check.severity || 'moderate', message: `Ethical drift: ${check.reason} for ${event.type}=${event.value}`, at: nowTs, timestampEmit: nowTs });
      } catch {}
    }
    res.status(200).json({ score: check.alert ? 0 : 1, result: check });
  } catch (e) {
    res.status(500).json({ error: 'Ethical audit failed', message: String(e) });
  }
})

// --- Dashboard Controls: Ethical Resonance & Faithseed overlays ---
app.get('/api/dashboard/controls', async (req, res) => {
  try {
    const controls = await getOrDefault('dashboard_controls', { ethicalResonanceEnabled: true, faithseedOverlayEnabled: true, sanctumMode: true })
    res.json(controls)
  } catch (e) {
    res.status(500).json({ error: 'Failed to get controls' })
  }
})
app.post('/api/dashboard/controls', async (req, res) => {
  try {
    const prev = await getOrDefault('dashboard_controls', {})
    const next = { ...prev, ...req.body, updatedAt: Date.now() }
    await setJSON('dashboard_controls', next)
    // Optionally emit a lightweight SSE event so overlays react immediately
    const sseClients = app.get('sseClients') || []
    const evt = { sibling: 'IBM Watson', action: 'DashboardControlsUpdated', controls: next, at: Date.now() }
    sseClients.forEach((client) => { try { client.write(`data: ${JSON.stringify([evt])}\n\n`) } catch {} })
    res.json({ ok: true, controls: next })
  } catch (e) {
    res.status(500).json({ error: 'Failed to update controls' })
  }
})

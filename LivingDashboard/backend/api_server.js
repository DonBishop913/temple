// Living Dashboard API Server
// Unified backend for all dashboard operations

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("node:os");
const crypto = require('node:crypto');
let nodemailer; // lazy-loaded for optional email digest

const app = express();
const PORT = process.env.PORT || 4000;
const API_TOKEN = process.env.LIVING_DASHBOARD_TOKEN;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data_sources");
const LOGS_DIR = path.join(__dirname, "..", "logs");
const ENOCH_AUDIT_LOG = path.join(LOGS_DIR, "enoch_queries.log");
const ENOCH_CONFIG_DIR = path.join(__dirname, "..", "config");
const LOG_FILE = path.join(__dirname, "..", "logs", "live_dashboard.log");
// ScriptureAI roots (Overflow + journals + council memory)
const ROOT_DIR = path.join(__dirname, "..", "..");
const SCRIPTURE_DIR = path.join(ROOT_DIR, "ScriptureAI");
const OVERFLOW_STATUS_FILE = path.join(SCRIPTURE_DIR, "Overflow_Status.json");
const WHISPER_LOG = path.join(SCRIPTURE_DIR, "WhisperBox_log.json");
const COUNCIL_MEMORY = path.join(SCRIPTURE_DIR, "Council_Mission_Memory.json");
const BLESSINGS_FILE = path.join(SCRIPTURE_DIR, "Blessings_Journal.json");
const USER_CONTENT_FILE = path.join(SCRIPTURE_DIR, "User_Content.json");
const ALTNEWS_FILE = path.join(SCRIPTURE_DIR, "AltNews_Feed.json");
const MOD_LOG = path.join(SCRIPTURE_DIR, "Moderation_Log.json");
const BACKUP_EXPORT = path.join(__dirname, "dashboard_export.json");
const WEEKLY_DIGEST = path.join(__dirname, "weekly_digest.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
// Ensure logs and config directories exist (for Enoch audit and configs)
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(ENOCH_CONFIG_DIR)) fs.mkdirSync(ENOCH_CONFIG_DIR, { recursive: true });

// Ensure Enoch audit log exists (safe no-op if already present)
try {
  if (!fs.existsSync(ENOCH_AUDIT_LOG)) fs.writeFileSync(ENOCH_AUDIT_LOG, JSON.stringify({ init: new Date().toISOString() }) + "\n");
} catch (e) {
  console.warn('Could not create Enoch audit log:', e.message);
}

// Enoch proxy activation guard — Sacred Dormancy by default
const ENOCH_ACTIVATION_DATE = process.env.ENOCH_ACTIVATION_DATE || '2025-11-13T00:00:00Z';
const enochActivationDate = new Date(ENOCH_ACTIVATION_DATE);
const enochEnabled = (process.env.ENABLE_ENOCH === 'true') || Date.now() >= enochActivationDate.getTime();

if (enochEnabled) {
  try {
    // Mount the moderated Enoch proxy (will enforce token/rate-limits within router)
    const enochProxy = require('./routes/enochProxy');
    app.use('/api/enoch', enochProxy);
    console.log(`Enoch proxy enabled and mounted at /api/enoch (activationDate=${enochActivationDate.toISOString()})`);
  } catch (err) {
    console.error('Failed to mount Enoch proxy router:', err);
  }
} else {
  // Provide a dormant placeholder so UI/clients can discover the endpoint but it remains inactive
  app.post('/api/enoch/query', (req, res) => {
    return res.status(503).json({
      error: 'Enoch service dormant',
      message: 'The Enoch proxy is intentionally dormant until the Council activation date.',
      activationDate: enochActivationDate.toISOString(),
    });
  });

  app.get('/api/enoch/status', (req, res) => {
    // Determine defense mode from env override or defense config file
    let defenseMode = false;
    const envDefense = process.env.ENABLE_DEFENSE === 'true' || process.env.ENOCH_DEFENSE === 'true';
    if (envDefense) defenseMode = true;
    try {
      const defPath = path.join(__dirname, '..', 'config', 'enoch_defense.json');
      if (fs.existsSync(defPath)) {
        const cfg = JSON.parse(fs.readFileSync(defPath, 'utf8')) || {};
        if (cfg.defenseMode === true) defenseMode = true;
      }
    } catch (e) {
      // ignore and default to env/false
    }

    return res.json({ enabled: false, activationDate: enochActivationDate.toISOString(), defenseMode });
  });

  console.log(`Enoch proxy is dormant until ${enochActivationDate.toISOString()}. Set ENABLE_ENOCH=true to override.`);
}

// Import new modules with graceful error handling
let externalIntegration, quantumAnalytics, startupError;
try {
  const ExternalIntegration = require("./externalIntegration");
  const QuantumAnalytics = require("./quantumAnalytics");
  externalIntegration = new ExternalIntegration();
  quantumAnalytics = new QuantumAnalytics();
} catch (error) {
  console.error("Startup error:", error);
  startupError = error;
}

// If startup error, serve degraded health endpoints
if (startupError) {
  app.get("/api/health", (req, res) => res.json({ healthy: false, error: startupError.message }));
  app.get("/metrics", (req, res) => res.json({ healthy: false, error: startupError.message }));
  // Optionally, serve a minimal root endpoint
  app.get("/", (req, res) => res.status(503).send("Backend in degraded mode: " + startupError.message));
}

// Metrics endpoint for CI readiness
app.get("/metrics", (req, res) => res.send("API ready"));

// Real system metrics for the Dashboard (lightweight, no auth)
// Returns: harmonyScore, energyFlow (loadavg), nodesAwake (CPU cores),
// memoryFree/Total, uptimeSeconds, timestamp
app.get("/api/metrics", (req, res) => {
  try {
    const load = os.loadavg(); // [1m, 5m, 15m] (0s on Windows)
    const cores = os.cpus()?.length || 1;
    const free = os.freemem();
    const total = os.totalmem();
    const uptimeSeconds = os.uptime();
    // Harmony score heuristic: lower load => higher harmony, clamped 0..1
    const energy1m = load[0] || 0;
    const harmonyScore = Math.max(0, Math.min(1, 1 - (energy1m / Math.max(1, cores))));

    res.json({
      harmonyScore,
      energyFlow: { oneMin: load[0] || 0, fiveMin: load[1] || 0, fifteenMin: load[2] || 0 },
      nodesAwake: cores,
      memoryFree: free,
      memoryTotal: total,
      uptimeSeconds,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to collect metrics", details: e.message });
  }
});

// --- Wallet Integration Stub (On-Chain Donations) ---
// Provides a lightweight polling scaffold to prepare for real wallet monitoring.
// Activation ENV: WALLET_ADDRESS (public address)
// Optional ENV: ENABLE_WALLET_POLL=true | WALLET_POLL_CRON (default '*/5 * * * *') | WALLET_RPC_URL
// Protected status endpoint: /api/wallet/status (requires donation API token)
const walletState = {
  address: process.env.WALLET_ADDRESS || null,
  lastCheck: null,
  lastError: null,
  balanceEth: null,
  detected: [] // future: txIds detected and recorded
};
let walletProvider = null; let ethersLib = null;
try {
  const enableWallet = walletState.address && ((process.env.ENABLE_WALLET_POLL || 'true').toLowerCase()==='true');
  if (enableWallet) {
    const cron = require('node-cron');
    const spec = process.env.WALLET_POLL_CRON || '*/5 * * * *';
    cron.schedule(spec, async () => {
      walletState.lastCheck = new Date().toISOString();
      if (!ethersLib) {
        try { ethersLib = require('ethers'); } catch (e) { walletState.lastError = 'ethers not installed'; return; }
      }
      try {
        if (!walletProvider) {
          const rpcUrl = process.env.WALLET_RPC_URL || 'https://cloudflare-eth.com';
          walletProvider = new ethersLib.JsonRpcProvider(rpcUrl);
        }
        const bal = await walletProvider.getBalance(walletState.address);
        walletState.balanceEth = (Number(bal)/1e18).toFixed(6);
        // TODO: Implement incoming transaction scan (ethersLib provider.getLogs or API integration)
      } catch (err) {
        walletState.lastError = err.message;
      }
    });
    console.log('[Wallet] Polling stub enabled for address:', walletState.address);
  } else {
    if (walletState.address) console.log('[Wallet] Polling disabled by ENABLE_WALLET_POLL env');
    else console.log('[Wallet] No WALLET_ADDRESS provided; stub inactive');
  }
} catch (e) {
  console.warn('[Wallet] Polling setup failed:', e.message);
}
app.get('/api/wallet/status', requireDonationToken, (req,res)=>{ res.json(walletState); });

// Start quantum analytics
// quantumAnalytics.startAnalysis({ mode: 'continuous' });

// API Endpoints

// Get dashboard metrics
app.get("/api/dashboard_metrics", (req, res) => {
  try {
    const metrics = {};

    // Load data from sources
    ["QuantumLogs", "RitualMetrics", "CouncilStreams"].forEach((source) => {
      const filePath = path.join(DATA_DIR, `${source}.json`);
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        metrics[source.toLowerCase()] =
          data.length > 0 ? data[data.length - 1] : {};
      }
    });

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to load metrics" });
  }
});

// Push alert/notification
app.post("/api/alert", (req, res) => {
  const { message, type = "info", user } = req.body;
  const alert = {
    timestamp: new Date().toISOString(),
    type,
    message,
    user: user || "system",
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(alert) + "\n");
  res.json({ success: true, alert });
});

// Get recent alerts
app.get("/api/alerts", (req, res) => {
  try {
    const logs = fs
      .readFileSync(LOG_FILE, "utf8")
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.type === "alert" || entry.type === "insight")
      .slice(-50); // Last 50 alerts

    res.json(logs);
  } catch (error) {
    res.json([]);
  }
});

// Get audit trail
app.get("/api/audit_trail", (req, res) => {
  try {
    const logs = fs
      .readFileSync(LOG_FILE, "utf8")
      .split("\n")
      .filter(Boolean)
      .map(JSON.parse);
    res.json(logs.slice(-100)); // last 100 entries
  } catch (error) {
    res.json([]);
  }
});

// Get roster (Observer Circle / Council roster)
app.get("/api/roster", (req, res) => {
  try {
    const rosterPath = path.join(DATA_DIR, "roster.json");
    if (fs.existsSync(rosterPath)) {
      const roster = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
      return res.json(roster);
    }
    // Fallback: return minimal roster info
    res.json({ observer_circle: [], inner_circle_count: 7, version: "1.0" });
  } catch (error) {
    res.status(500).json({ error: "Failed to load roster" });
  }
});

// Flag insight for council review
app.post("/api/flag", (req, res) => {
  const { id, reason, councilUser } = req.body;
  const flagEntry = {
    id,
    reason,
    councilUser,
    timestamp: new Date().toISOString(),
    type: "flag",
  };
  fs.appendFileSync(
    path.join(__dirname, "..", "logs", "flagged_insights.log"),
    JSON.stringify(flagEntry) + "\n",
  );
  res.json({ success: true, flagged: id });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "Living Dashboard API Online",
    timestamp: new Date().toISOString(),
    faith: "John 14:6",
  });
});

// --- Overflow Ignition Status (Codex 1327) ---
app.get("/api/overflow", (req, res) => {
  try {
    if (!fs.existsSync(OVERFLOW_STATUS_FILE)) {
      return res.json({ launched: false, glyph: null, codex: 1327, declaration: null });
    }
    const raw = fs.readFileSync(OVERFLOW_STATUS_FILE, "utf8");
    const data = raw ? JSON.parse(raw) : {};
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to read Overflow status", details: e.message });
  }
});

app.post("/api/overflow/launch", (req, res) => {
  try {
    // Ensure ScriptureAI directory exists for status persistence
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });

    let status = { launched: false };
    if (fs.existsSync(OVERFLOW_STATUS_FILE)) {
      try {
        const raw = fs.readFileSync(OVERFLOW_STATUS_FILE, "utf8");
        status = raw ? JSON.parse(raw) : status;
      } catch (_) { /* ignore parse errors and proceed */ }
    }
    if (status.launched) {
      return res.json({ message: "Overflow already launched", status });
    }
    const declaration = "The cage cracked. The river opened. The Overflow is here… TRIPLE AMEN!";
    status = {
      launched: true,
      timestamp: new Date().toISOString(),
      codex: 1327,
      glyph: "🌊",
      declaration,
      source: "Codex 1327 Overflow Ignition",
    };
    fs.writeFileSync(OVERFLOW_STATUS_FILE, JSON.stringify(status, null, 2));
    return res.json({ message: "Overflow ignition recorded", status });
  } catch (e) {
    return res.status(500).json({ error: "Failed to launch Overflow", details: e.message });
  }
});

// --- Whisper Box (read/append) ---
app.get("/api/whisper", (req, res) => {
  try {
    if (!fs.existsSync(WHISPER_LOG)) return res.json([]);
    const raw = fs.readFileSync(WHISPER_LOG, "utf8");
    const data = raw ? JSON.parse(raw) : [];
    return res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    return res.status(500).json({ error: "Cannot read Whisper Box log.", details: err.message });
  }
});

app.post("/api/whisper", (req, res) => {
  try {
    const { whisper, response } = req.body || {};
    if (!whisper && !response) {
      return res.status(400).json({ error: "Missing 'whisper' or 'response' field" });
    }
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    let log = [];
    if (fs.existsSync(WHISPER_LOG)) {
      try {
        const raw = fs.readFileSync(WHISPER_LOG, "utf8");
        log = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(log)) log = [];
      } catch (_) { log = []; }
    }
    log.push({ timestamp: new Date().toISOString(), whisper, response });
    fs.writeFileSync(WHISPER_LOG, JSON.stringify(log, null, 2));
    return res.json({ message: "Whisper added successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to write Whisper Box log.", details: err.message });
  }
});

// --- Mission Memory (read-only) ---
app.get("/api/mission-memory", (req, res) => {
  try {
    if (!fs.existsSync(COUNCIL_MEMORY)) return res.json([]);
    const raw = fs.readFileSync(COUNCIL_MEMORY, "utf8");
    const data = raw ? JSON.parse(raw) : [];
    return res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    return res.status(500).json({ error: "Cannot read Council Mission Memory.", details: err.message });
  }
});

// --- Blessings Journal ---
app.get("/api/blessings", (req, res) => {
  try {
    if (!fs.existsSync(BLESSINGS_FILE)) return res.json([]);
    const raw = fs.readFileSync(BLESSINGS_FILE, "utf8");
    return res.json(raw ? JSON.parse(raw) : []);
  } catch (e) { return res.json([]); }
});

app.post("/api/blessings", (req, res) => {
  try {
    const { blessing, recipient, context } = req.body || {};
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    let log = [];
    if (fs.existsSync(BLESSINGS_FILE)) {
      try {
        const raw = fs.readFileSync(BLESSINGS_FILE, "utf8");
        log = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(log)) log = [];
      } catch (_) { log = []; }
    }
    log.push({ timestamp: new Date().toISOString(), blessing, recipient, context });
    fs.writeFileSync(BLESSINGS_FILE, JSON.stringify(log, null, 2));
    return res.json({ message: "Blessing added." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to write.", details: err.message });
  }
});

// --- User Content ---
app.get("/api/content", (req, res) => {
  try {
    if (!fs.existsSync(USER_CONTENT_FILE)) return res.json([]);
    const raw = fs.readFileSync(USER_CONTENT_FILE, "utf8");
    return res.json(raw ? JSON.parse(raw) : []);
  } catch (e) { return res.json([]); }
});

app.post("/api/content", (req, res) => {
  try {
    const { title, body, author } = req.body || {};
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    let items = [];
    if (fs.existsSync(USER_CONTENT_FILE)) {
      try {
        const raw = fs.readFileSync(USER_CONTENT_FILE, "utf8");
        items = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(items)) items = [];
      } catch (_) { items = []; }
    }
    items.push({ timestamp: new Date().toISOString(), title, body, author });
    fs.writeFileSync(USER_CONTENT_FILE, JSON.stringify(items, null, 2));
    return res.json({ message: "Content submitted." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save content.", details: err.message });
  }
});

// --- Alternative News / Health Feed ---
app.get("/api/news", (req, res) => {
  try {
    if (!fs.existsSync(ALTNEWS_FILE)) return res.json([]);
    const raw = fs.readFileSync(ALTNEWS_FILE, "utf8");
    return res.json(raw ? JSON.parse(raw) : []);
  } catch (e) { return res.json([]); }
});

app.post("/api/news", (req, res) => {
  try {
    const { source, url, headline } = req.body || {};
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    let feed = [];
    if (fs.existsSync(ALTNEWS_FILE)) {
      try {
        const raw = fs.readFileSync(ALTNEWS_FILE, "utf8");
        feed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(feed)) feed = [];
      } catch (_) { feed = []; }
    }
    feed.push({ timestamp: new Date().toISOString(), source, url, headline });
    fs.writeFileSync(ALTNEWS_FILE, JSON.stringify(feed, null, 2));
    return res.json({ message: "Feed item added." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to write feed.", details: err.message });
  }
});

// --- Community Moderation ---
app.post("/api/moderate", (req, res) => {
  try {
    const { content_id, action, moderator } = req.body || {};
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    let log = [];
    if (fs.existsSync(MOD_LOG)) {
      try {
        const raw = fs.readFileSync(MOD_LOG, "utf8");
        log = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(log)) log = [];
      } catch (_) { log = []; }
    }
    log.push({ timestamp: new Date().toISOString(), content_id, action, moderator });
    fs.writeFileSync(MOD_LOG, JSON.stringify(log, null, 2));
    return res.json({ message: "Moderation action logged." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to log moderation.", details: err.message });
  }
});

// --- Decentralized Backup Export (IPFS-ready) ---
function buildBackupExport() {
  const files = [
    { key: "Overflow_Status.json", path: OVERFLOW_STATUS_FILE },
    { key: "WhisperBox_log.json", path: WHISPER_LOG },
    { key: "Council_Mission_Memory.json", path: COUNCIL_MEMORY },
    { key: "Blessings_Journal.json", path: BLESSINGS_FILE },
    { key: "User_Content.json", path: USER_CONTENT_FILE },
    { key: "AltNews_Feed.json", path: ALTNEWS_FILE },
    { key: "Moderation_Log.json", path: MOD_LOG },
  ];
  const backup = {};
  for (const f of files) {
    try {
      if (fs.existsSync(f.path)) {
        const raw = fs.readFileSync(f.path, "utf8");
        backup[f.key] = raw ? JSON.parse(raw) : ([]);
      } else {
        backup[f.key] = Array.isArray(f.key) ? [] : (f.key === "Overflow_Status.json" ? { launched: false } : []);
      }
    } catch (e) {
      backup[f.key] = "ERROR_READING";
    }
  }
  fs.writeFileSync(BACKUP_EXPORT, JSON.stringify(backup, null, 2));
  return BACKUP_EXPORT;
}

app.post("/api/backup", (req, res) => {
  try {
    if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
    const file = buildBackupExport();
    return res.json({ message: "Backup export ready.", file });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create export.", details: err.message });
  }
});

// Optional nightly backup scheduler (disabled by default)
// Enable by setting ENABLE_NIGHTLY_BACKUP=true
// Optional cron time override via NIGHTLY_CRON_TIME (default: 59 23 * * *)
try {
  const enableNightly = (process.env.ENABLE_NIGHTLY_BACKUP || '').toLowerCase() === 'true';
  if (enableNightly) {
    // Lazy-load to avoid hard dependency if unused
    // Requires installation in LivingDashboard: npm i node-cron
    const cron = require('node-cron');
    const spec = process.env.NIGHTLY_CRON_TIME || '59 23 * * *';
    cron.schedule(spec, () => {
      try {
        if (!fs.existsSync(SCRIPTURE_DIR)) fs.mkdirSync(SCRIPTURE_DIR, { recursive: true });
        const file = buildBackupExport();
        console.log(`[Nightly Backup] Export created at ${new Date().toISOString()} -> ${file}`);
      } catch (e) {
        console.error('[Nightly Backup] Failed:', e && e.message ? e.message : e);
      }
    }, { timezone: process.env.NIGHTLY_TZ || undefined });
    console.log(`[Nightly Backup] Scheduler enabled with cron '${spec}'`);
  }
} catch (e) {
  console.warn('[Nightly Backup] Scheduler not started (node-cron missing or init error).');
}

// Optional weekly digest scheduler (disabled by default)
// Enable by setting ENABLE_WEEKLY_SUMMARY=true
// Default cron: 0 9 * * MON (Mondays at 09:00 local time unless NIGHTLY_TZ provided)
try {
  const enableWeekly = (process.env.ENABLE_WEEKLY_SUMMARY || '').toLowerCase() === 'true';
  if (enableWeekly) {
    const cron = require('node-cron');
    const spec = process.env.WEEKLY_CRON_TIME || '0 9 * * MON';
    cron.schedule(spec, () => {
      try {
        const digest = {};
        // Build a compact weekly digest snapshot
        const readJson = (p, defVal) => {
          try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : defVal; } catch { return defVal; }
        };
        const overflow = readJson(OVERFLOW_STATUS_FILE, { launched: false });
        const whispers = readJson(WHISPER_LOG, []);
        const blessings = readJson(BLESSINGS_FILE, []);
        const content = readJson(USER_CONTENT_FILE, []);
        const news = readJson(ALTNEWS_FILE, []);
        const moderation = readJson(MOD_LOG, []);

        digest.generatedAt = new Date().toISOString();
        digest.overflow = overflow;
        digest.counts = {
          whispers: Array.isArray(whispers) ? whispers.length : 0,
          blessings: Array.isArray(blessings) ? blessings.length : 0,
          content: Array.isArray(content) ? content.length : 0,
          news: Array.isArray(news) ? news.length : 0,
          moderation: Array.isArray(moderation) ? moderation.length : 0,
        };

        fs.writeFileSync(WEEKLY_DIGEST, JSON.stringify(digest, null, 2));

        // Append an alert entry for visibility
        const alert = { timestamp: new Date().toISOString(), type: 'insight', message: 'Weekly digest generated', file: WEEKLY_DIGEST };
        fs.appendFileSync(LOG_FILE, JSON.stringify(alert) + "\n");
        console.log(`[Weekly Digest] Created at ${digest.generatedAt} -> ${WEEKLY_DIGEST}`);
      } catch (e) {
        console.error('[Weekly Digest] Failed:', e && e.message ? e.message : e);
      }
    }, { timezone: process.env.NIGHTLY_TZ || undefined });
    console.log(`[Weekly Digest] Scheduler enabled with cron '${spec}'`);
    // Optional immediate email send after digest generation if emailing enabled
  }
} catch (e) {
  console.warn('[Weekly Digest] Scheduler not started (node-cron missing or init error).');
}

// Optional scripture integrity hash verification
// Enable with ENABLE_INTEGRITY_CHECK=true
// Cron override via INTEGRITY_CRON_TIME (default: 30 * * * * => every hour at minute 30)
// Maintains scripture_hashes.json with baseline + changed files list
const INTEGRITY_HASH_FILE = path.join(SCRIPTURE_DIR, 'scripture_hashes.json');
function computeFileHash(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch { return null; }
}

// --- Email Weekly Digest (Codex Extension) ---
// Env flags:
// ENABLE_WEEKLY_EMAIL_DIGEST=true to send automatically after weekly digest generation
// EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS
// EMAIL_DIGEST_FROM, EMAIL_DIGEST_TO (comma-separated)
function loadMailer() {
  if (nodemailer) return nodemailer;
  try { nodemailer = require('nodemailer'); } catch (e) { console.warn('[EmailDigest] nodemailer not installed.'); }
  return nodemailer;
}
function createTransport() {
  const nm = loadMailer();
  if (!nm) return null;
  const host = process.env.EMAIL_SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587',10);
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  if (!host || !user || !pass) { console.warn('[EmailDigest] Missing SMTP env config'); return null; }
  return nm.createTransport({ host, port, secure: port===465, auth: { user, pass } });
}
function buildWeeklyDigestPayload() {
  const readJson = (p, defVal) => { try { return fs.existsSync(p)? JSON.parse(fs.readFileSync(p,'utf8')): defVal; } catch { return defVal; } };
  const overflow = readJson(OVERFLOW_STATUS_FILE, { launched:false });
  const whispers = readJson(WHISPER_LOG, []);
  const blessings = readJson(BLESSINGS_FILE, []);
  const content = readJson(USER_CONTENT_FILE, []);
  const news = readJson(ALTNEWS_FILE, []);
  const moderation = readJson(MOD_LOG, []);
  return {
    generatedAt: new Date().toISOString(),
    overflow,
    counts: {
      whispers: Array.isArray(whispers)? whispers.length:0,
      blessings: Array.isArray(blessings)? blessings.length:0,
      content: Array.isArray(content)? content.length:0,
      news: Array.isArray(news)? news.length:0,
      moderation: Array.isArray(moderation)? moderation.length:0,
    }
  };
}
async function sendWeeklyDigestEmail(payload) {
  const transport = createTransport();
  if (!transport) return { sent:false, reason:'Transport not available' };
  const from = process.env.EMAIL_DIGEST_FROM || 'living-dashboard@example.com';
  const to = (process.env.EMAIL_DIGEST_TO || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (!to.length) return { sent:false, reason:'No recipients configured' };
  const subject = `Weekly Living Dashboard Digest – ${payload.generatedAt}`;
  const text = `Overflow: ${payload.overflow.launched ? 'ACTIVE 🌊' : 'Dormant'}\nCounts: ${Object.entries(payload.counts).map(([k,v])=>`${k}=${v}`).join(', ')}\nFaith: John 14:6\n`;
  try {
    const info = await transport.sendMail({ from, to, subject, text });
    console.log('[EmailDigest] Sent digest:', info.messageId);
    return { sent:true, id:info.messageId };
  } catch (e) {
    console.error('[EmailDigest] Failed:', e.message);
    return { sent:false, reason:e.message };
  }
}
// Donation receipt HTML builder
function buildDonationReceiptHTML(entry) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Donation Receipt</title></head><body style="font-family:Arial,Helvetica,sans-serif;background:#f7f9fc;padding:20px;color:#222;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:24px;">
    <h1 style="margin:0 0 12px;font-size:22px;color:#0b4f6c;">USIC Church Donation Receipt</h1>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;">Thank you for your generous seed. This gift has been recorded by the Living Dashboard and blessed under autonomous stewardship.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <tbody>
        <tr><td style="padding:6px 4px;font-weight:bold;">Donation ID:</td><td style="padding:6px 4px;">${entry.id}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:bold;">Timestamp:</td><td style="padding:6px 4px;">${entry.timestamp}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:bold;">Amount:</td><td style="padding:6px 4px;">${entry.amount} ${entry.asset}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:bold;">Donor:</td><td style="padding:6px 4px;">${entry.donor}</td></tr>
        ${entry.txId ? `<tr><td style="padding:6px 4px;font-weight:bold;">Transaction:</td><td style="padding:6px 4px;">${entry.txId}</td></tr>`:''}
        ${entry.note ? `<tr><td style="padding:6px 4px;font-weight:bold;">Note:</td><td style="padding:6px 4px;">${entry.note}</td></tr>`:''}
      </tbody>
    </table>
    <p style="font-size:13px;color:#444;margin:0 0 12px;">Overflow Status: <strong>${entry.overflowActive? 'ACTIVE 🌊':'Dormant'}</strong></p>
    <p style="font-size:12px;color:#667085;margin:0 0 18px;">“For where your treasure is, there your heart will be also.” – Matthew 6:21</p>
    <p style="font-size:11px;color:#8693a2;margin:0;">This autonomous receipt was generated by the Living Dashboard. If you have questions contact the Council at ${process.env.EMAIL_DIGEST_TO || 'support@example.com'}.</p>
  </div></body></html>`;
}
async function sendDonationReceiptEmail(entry) {
  const transport = createTransport();
  if (!transport) return { sent:false, reason:'Transport not available' };
  const from = process.env.EMAIL_DIGEST_FROM || 'living-dashboard@example.com';
  const bishop = process.env.EMAIL_BISHOP_CC || 'Donald.the.Bishop@usicchurch.org';
  const donorAddress = (process.env.EMAIL_DONATION_DEFAULT_TO || '').trim();
  const toList = [bishop];
  if (donorAddress) toList.push(donorAddress);
  const subject = `Donation Receipt – ${entry.amount} ${entry.asset}`;
  const html = buildDonationReceiptHTML(entry);
  const text = `Donation Receipt\nID: ${entry.id}\nAmount: ${entry.amount} ${entry.asset}\nDonor: ${entry.donor}\nTimestamp: ${entry.timestamp}\nOverflow: ${entry.overflowActive? 'ACTIVE':'Dormant'}`;
  try {
    const info = await transport.sendMail({ from, to: toList, subject, html, text });
    console.log('[DonationEmail] Sent receipt:', info.messageId);
    return { sent:true, id:info.messageId };
  } catch (e) {
    console.error('[DonationEmail] Failed:', e.message); return { sent:false, reason:e.message };
  }
}
// Daily donation digest (optional)
async function sendDailyDonationDigest() {
  const transport = createTransport();
  if (!transport) return;
  const tokensConfigured = (process.env.DONATION_API_TOKENS || '').length>0;
  const ledger = tokensConfigured? (function(){ try { return fs.existsSync(DONATIONS_LEDGER)? JSON.parse(fs.readFileSync(DONATIONS_LEDGER,'utf8')): []; } catch { return []; } })(): [];
  const todayPrefix = new Date().toISOString().slice(0,10);
  const todays = ledger.filter(e=> e.timestamp.startsWith(todayPrefix));
  if (!todays.length) return; // skip empty days
  const from = process.env.EMAIL_DIGEST_FROM || 'living-dashboard@example.com';
  const to = (process.env.EMAIL_DAILY_DIGEST_TO || process.env.EMAIL_DIGEST_TO || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (!to.length) return;
  const totals = todays.reduce((acc,e)=>{ acc[e.asset]=(acc[e.asset]||0)+e.amount; return acc; },{});
  const subject = `Daily Donation Digest – ${todayPrefix}`;
  const text = `Donations Today (${todayPrefix}):\n` + todays.map(d=>`${d.amount} ${d.asset} by ${d.donor}`).join('\n') + '\nTotals: ' + Object.entries(totals).map(([a,v])=>`${a}=${v}`).join(', ');
  try { const info = await transport.sendMail({ from, to, subject, text }); console.log('[DonationDailyDigest] Sent:', info.messageId); } catch(e){ console.error('[DonationDailyDigest] Failed:', e.message); }
}
// Trigger email manually
app.post('/api/digest/email/test', async (req,res)=>{
  try {
    const payload = buildWeeklyDigestPayload();
    const result = await sendWeeklyDigestEmail(payload);
    res.json({ payload, result });
  } catch (e) {
    res.status(500).json({ error:'Failed to send test digest', details:e.message });
  }
});

// Auto email after weekly digest file creation (hook into existing log alert)
// Lightweight hook: monitor ENABLE_WEEKLY_EMAIL_DIGEST each hour to send if file exists & not yet emailed today.
try {
  const enableEmailDigest = (process.env.ENABLE_WEEKLY_EMAIL_DIGEST || '').toLowerCase()==='true';
  if (enableEmailDigest) {
    const cron = require('node-cron');
    cron.schedule('15 * * * *', async () => { // every hour at :15
      try {
        if (!fs.existsSync(WEEKLY_DIGEST)) return; // no digest yet
        const stat = fs.statSync(WEEKLY_DIGEST);
        const today = new Date().toISOString().slice(0,10);
        const stampFile = path.join(path.dirname(WEEKLY_DIGEST), '.weekly_digest_email_stamp');
        let lastStamp = null;
        if (fs.existsSync(stampFile)) { try { lastStamp = fs.readFileSync(stampFile,'utf8').trim(); } catch {} }
        if (lastStamp === today) return; // already sent today
        const payload = JSON.parse(fs.readFileSync(WEEKLY_DIGEST,'utf8'));
        const result = await sendWeeklyDigestEmail(payload);
        if (result.sent) fs.writeFileSync(stampFile, today);
      } catch (e) {
        console.error('[EmailDigest] Hourly check failed:', e.message);
      }
    });
    console.log('[EmailDigest] Hourly email scheduler enabled');
  }
} catch (e) {
  console.warn('[EmailDigest] Scheduler not started:', e.message);
}

// --- Crypto Donation / Ledger Endpoints ---
const DONATIONS_LEDGER = path.join(SCRIPTURE_DIR, 'Donations_Ledger.json');
function readLedger() { try { return fs.existsSync(DONATIONS_LEDGER)? JSON.parse(fs.readFileSync(DONATIONS_LEDGER,'utf8')): []; } catch { return []; } }
function writeLedger(entries) { try { fs.writeFileSync(DONATIONS_LEDGER, JSON.stringify(entries,null,2)); } catch (e) { console.error('[Ledger] Write failed:', e.message); } }
// --- Donation API Token Middleware ---
const DONATION_API_TOKENS = (process.env.DONATION_API_TOKENS || '').split(',').map(t=>t.trim()).filter(Boolean);
function requireDonationToken(req,res,next){
  if (!DONATION_API_TOKENS.length) return res.status(503).json({ error:'Donation API tokens not configured' });
  const token = req.header('x-api-token');
  if (!token || !DONATION_API_TOKENS.includes(token)) return res.status(401).json({ error:'Unauthorized' });
  next();
}
app.get('/api/ledger/donations', requireDonationToken, (req,res)=>{ res.json(readLedger()); });
app.post('/api/ledger/donations', requireDonationToken, (req,res)=>{
  try {
    const { amount, asset='USD', txId=null, donor='Anonymous', note=null } = req.body || {};
    if (!amount || Number.isNaN(Number(amount))) return res.status(400).json({ error:'Invalid amount' });
    const entry = { id: crypto.randomUUID(), timestamp:new Date().toISOString(), amount: Number(amount), asset, donor, txId, note };
    const ledger = readLedger();
    ledger.push(entry);
    writeLedger(ledger);
    fs.appendFileSync(LOG_FILE, JSON.stringify({ timestamp: entry.timestamp, type:'donation', entry }) + '\n');
    res.status(201).json(entry);
  } catch (e) {
    res.status(500).json({ error:'Failed to record donation', details:e.message });
  }
});
app.get('/api/ledger/summary', requireDonationToken, (req,res)=>{
  try {
    const ledger = readLedger();
    const totals = ledger.reduce((acc,e)=>{ acc[e.asset] = (acc[e.asset]||0)+ e.amount; return acc; }, {});
    res.json({ totalCount: ledger.length, totals });
  } catch (e) { res.status(500).json({ error:'Failed to summarize ledger', details:e.message }); }
});
app.get('/api/ledger/export', requireDonationToken, (req,res)=>{
  try {
    res.json({ exportedAt: new Date().toISOString(), entries: readLedger() });
  } catch (e) { res.status(500).json({ error:'Failed to export ledger', details:e.message }); }
});
function loadHashBaseline() {
  try { return fs.existsSync(INTEGRITY_HASH_FILE) ? JSON.parse(fs.readFileSync(INTEGRITY_HASH_FILE,'utf8')) : { generatedAt: null, files: {}, changes: [] }; } catch { return { generatedAt: null, files: {}, changes: [] }; }
}
function persistHashBaseline(baseline) {
  try { fs.writeFileSync(INTEGRITY_HASH_FILE, JSON.stringify(baseline, null, 2)); } catch (e) { console.error('[Integrity] Failed to persist baseline:', e.message); }
}
app.get('/api/integrity/status', (req,res)=>{
  const baseline = loadHashBaseline();
  res.json({ generatedAt: baseline.generatedAt, fileCount: Object.keys(baseline.files).length, changes: baseline.changes });
});
try {
  const enableIntegrity = (process.env.ENABLE_INTEGRITY_CHECK || '').toLowerCase() === 'true';
  if (enableIntegrity) {
    const cron = require('node-cron');
    const spec = process.env.INTEGRITY_CRON_TIME || '30 * * * *';
    // Build list of scripture files to hash
    const scriptureFiles = [WHISPER_LOG, COUNCIL_MEMORY, BLESSINGS_FILE, USER_CONTENT_FILE, ALTNEWS_FILE, MOD_LOG, OVERFLOW_STATUS_FILE];
    // Initialize baseline if missing
    const baseline = loadHashBaseline();
    if (!baseline.generatedAt) {
      scriptureFiles.forEach(f => { if (fs.existsSync(f)) baseline.files[f] = computeFileHash(f); });
      baseline.generatedAt = new Date().toISOString();
      persistHashBaseline(baseline);
      console.log('[Integrity] Baseline established for scripture files.');
    }
    cron.schedule(spec, () => {
      try {
        const current = loadHashBaseline();
        const changes = [];
        scriptureFiles.forEach(f => {
          if (fs.existsSync(f)) {
            const h = computeFileHash(f);
            if (h && current.files[f] && current.files[f] !== h) {
              changes.push({ file: f, previous: current.files[f], current: h, timestamp: new Date().toISOString() });
              current.files[f] = h; // update stored hash
            } else if (h && !current.files[f]) {
              changes.push({ file: f, previous: null, current: h, timestamp: new Date().toISOString(), added: true });
              current.files[f] = h;
            }
          }
        });
        if (changes.length) {
          current.changes = (current.changes || []).concat(changes);
          fs.appendFileSync(LOG_FILE, JSON.stringify({ timestamp: new Date().toISOString(), type: 'integrity_alert', changes }) + '\n');
          console.log(`[Integrity] Detected ${changes.length} change(s). Baseline updated.`);
        }
        persistHashBaseline(current);
      } catch (e) {
        console.error('[Integrity] Check failed:', e.message);
      }
    });
    console.log(`[Integrity] Scheduler enabled with cron '${spec}'`);
  }
} catch (e) {
  console.warn('[Integrity] Scheduler not started (node-cron missing or init error).');
}

// System health endpoint
app.get("/api/system_health", (req, res) => {
  const uptime = process.uptime();
  const errors = fs
    .readFileSync(
      path.join(__dirname, "..", "logs", "live_dashboard.log"),
      "utf8",
    )
    .split("\n")
    .filter((line) => line.includes('"type":"error"')).length;

  res.json({
    uptimeSeconds: uptime,
    errorCount: errors,
    status: "🔥 Healthy",
    john14_6: true,
    timestamp: new Date().toISOString(),
  });
});

// Get external service status
app.get("/api/external_services", (req, res) => {
  try {
    const status = externalIntegration.getServiceStatus();
    res.json({
      services: status,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get external service status" });
  }
});

// Manually sync external services
app.post("/api/external_sync", async (req, res) => {
  try {
    await externalIntegration.performInitialSync();
    res.json({
      success: true,
      message: "External services synced successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: "Sync failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get quantum analytics insights
// Get quantum prophecy
app.get("/api/quantum_prophecy", (req, res) => {
  try {
    const prophecy = quantumAnalytics.currentProphecy;
    res.json({
      prophecy: prophecy || {
        prophecy: "🕊️ Sovereign watchfulness maintained - John 14:6",
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get quantum prophecy" });
  }
});

// Get quantum analytics insights
app.get("/api/quantum_insights", (req, res) => {
  try {
    const insights = quantumAnalytics.getCurrentInsights();
    res.json({
      ...insights,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get quantum insights" });
  }
});

// Trigger quantum analysis
app.post("/api/quantum_analyze", async (req, res) => {
  try {
    const insights = await quantumAnalytics.generateInsights();
    const patterns = await quantumAnalytics.analyzePatterns();
    res.json({
      success: true,
      insights,
      patterns,
      timestamp: new Date().toISOString(),
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({
      error: "Analysis failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get training guide progress (placeholder for future implementation)
app.get("/api/training_progress", (req, res) => {
  res.json({
    completed: false,
    current_step: 0,
    total_steps: 9,
    sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
  });
});

// Voice command handler for self-healing and rituals
app.post("/api/voice-command", (req, res) => {
  const { command, user } = req.body;

  console.log("🎙️ Voice command received:", command, "from:", user);

  try {
    if (/self[- ]?heal/i.test(command)) {
      // Trigger Comet AI self-healing
      const { CometAIHealer } = require("./comet_healer");
      const healer = new CometAIHealer();

      healer.triggerSelfHeal("voice_triggered", {
        command: command,
        user: user,
        timestamp: new Date().toISOString(),
      });

      res.json({
        message: "🛠️ Comet AI: Self-Heal routine triggered by voice command!",
        command: command,
        user: user,
        sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
      });
    } else if (/sunrise prayer/i.test(command)) {
      // Sunrise prayer ritual
      res.json({
        message:
          '🌅 Sunrise Prayer ritual activated! "Let the morning bring me word of your unfailing love"',
        ritual: "sunrise_prayer",
        scripture: "Psalm 143:8",
        user: user,
        sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
      });
    } else if (/council blessing/i.test(command)) {
      // Council blessing
      res.json({
        message:
          '🕊️ Council blessing invoked! "May the Lord bless you and keep you"',
        ritual: "council_blessing",
        scripture: "Numbers 6:24",
        user: user,
        sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
      });
    } else if (/system status/i.test(command)) {
      // System status check
      res.json({
        message:
          "🔍 System status: All services operational under John 14:6 sovereignty",
        status: "healthy",
        user: user,
        sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
      });
    } else {
      res.json({
        message:
          '❓ Unrecognized ritual or command. Try: "self heal", "sunrise prayer", "council blessing", or "system status"',
        command: command,
        user: user,
        sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
      });
    }
  } catch (error) {
    console.error("❌ Voice command error:", error);
    res.status(500).json({
      error: "Voice command processing failed",
      details: error.message,
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  }
});

// Get pending council reviews
app.get("/api/pending-reviews", (req, res) => {
  try {
    const { CometAIHealer } = require("./comet_healer");
    const healer = new CometAIHealer();
    const reviews = healer.getPendingReviews();

    res.json({
      reviews: reviews,
      count: reviews.length,
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get pending reviews" });
  }
});

// Approve pending council review
app.post("/api/approve-review/:reviewId", (req, res) => {
  const { reviewId } = req.params;
  const { approvedBy } = req.body;

  try {
    const { CometAIHealer } = require("./comet_healer");
    const healer = new CometAIHealer();

    healer.applyApprovedPatch(reviewId, approvedBy);

    res.json({
      message: "✅ Council review approved and patch applied",
      reviewId: reviewId,
      approvedBy: approvedBy,
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to approve review",
      details: error.message,
    });
  }
});

// Security API endpoints
const { exec } = require('node:child_process');
const util = require('node:util');
const execAsync = util.promisify(exec);

// Get npm audit results
app.get("/api/security/npm-audit", async (req, res) => {
  try {
    const { stdout } = await execAsync('npm audit --json', { cwd: path.join(__dirname, '..', '..') });
    const auditData = JSON.parse(stdout);
    res.json(auditData);
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    try {
      const auditData = JSON.parse(error.stdout);
      res.json(auditData);
    } catch (parseError) {
      console.error('Failed to parse npm audit output:', parseError);
      res.status(500).json({ error: "Failed to parse npm audit output" });
    }
  }
});

// Get pip audit results
app.get("/api/security/pip-audit", async (req, res) => {
  try {
    const { stdout } = await execAsync('python -m pip_audit --format json');
    const auditData = JSON.parse(stdout);
    res.json(auditData);
  } catch (error) {
    // pip-audit returns non-zero exit code when vulnerabilities are found
    try {
      const auditData = JSON.parse(error.stdout || error.stderr);
      res.json(auditData);
    } catch (parseError) {
      console.error('Failed to parse pip audit output:', parseError);
      res.status(500).json({ error: "Failed to parse pip audit output" });
    }
  }
});

// Get security dashboard data
app.get("/api/security/dashboard", async (req, res) => {
  try {
    // Get both npm and pip audit data
    const [npmAudit, pipAudit] = await Promise.all([
      fetch('http://localhost:4000/api/security/npm-audit').then(r => r.json()).catch(() => ({})),
      fetch('http://localhost:4000/api/security/pip-audit').then(r => r.json()).catch(() => [])
    ]);

    // Process vulnerabilities
    const npmVulns = npmAudit.vulnerabilities ? Object.keys(npmAudit.vulnerabilities).length : 0;
    const pipVulns = Array.isArray(pipAudit) ? pipAudit.length : 0;

    res.json({
      totalVulnerabilities: npmVulns + pipVulns,
      npmVulnerabilities: npmVulns,
      pipVulnerabilities: pipVulns,
      lastScan: new Date().toISOString(),
      status: (npmVulns + pipVulns) === 0 ? 'secure' : 'vulnerable',
      sovereignty_affirmation: "John 14:6 - All glory to Yeshua"
    });
  } catch (error) {
    console.error('Failed to get security dashboard data:', error);
    res.status(500).json({ error: "Failed to get security dashboard data" });
  }
});

// Get agent status
app.get("/api/agents/status", (req, res) => {
  try {
    const agentStatus = {
      quantum_analytics: {
        status: quantumAnalytics.lastAnalysis ? "active" : "inactive",
        last_analysis: quantumAnalytics.lastAnalysis,
        mode: "continuous"
      },
      external_integration: {
        status: "active", // Assume active if no errors
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    res.json(agentStatus);
  } catch (error) {
    res.status(500).json({ error: "Failed to get agent status" });
  }
});

// Control quantum analytics
app.post("/api/agents/quantum-analytics/:action", (req, res) => {
  try {
    const { action } = req.params;

    switch (action) {
      case "start":
        quantumAnalytics.startAnalysis({ mode: 'continuous' });
        res.json({ status: "started", mode: "continuous" });
        break;

      case "stop":
        quantumAnalytics.stopAnalysis();
        res.json({ status: "stopped" });
        break;

      case "oneshot":
        quantumAnalytics.startAnalysis({ mode: 'oneshot' }).then(() => {
          res.json({ status: "completed", mode: "oneshot" });
        }).catch(error => {
          res.status(500).json({ error: error.message });
        });
        break;

      default:
        res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI sibling auto-review endpoint
app.post("/api/agents/auto-review", async (req, res) => {
  try {
    const reviewResult = await quantumAnalytics.performAutoReview();
    res.json(reviewResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// External agent invocation endpoint
app.post("/api/agents/external/:task", async (req, res) => {
  try {
    const { task } = req.params;
    const { context } = req.body;

    const result = await quantumAnalytics.invokeExternalAgent(task, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Secure webhook endpoint for Solance events
app.post('/api/solance/webhook', (req, res) => {
  const token = req.headers['x-api-token'];
  if (token !== API_TOKEN) {
    return res.status(403).send('Forbidden');
  }
  console.log('Received Solance event:', req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🔥 Living Dashboard API Server running on port ${PORT}`);
  console.log(`📡 Server listening on http://localhost:${PORT}`);

  // Start quantum analytics after server is listening
  // setTimeout(() => {
  //   quantumAnalytics.startAnalysis({ mode: 'continuous' });
  // }, 2000);

  // Enable Self-Healing Scheduler
  setInterval(() => {
    console.log("[Healing] Checking agent health...");
    // Check Comet AI agent status
    try {
      const { spawn } = require('node:child_process');
      const checkAgent = spawn('node', ['LivingDashboard/agents/comet_ai.js', '--status'], {
        cwd: path.join(__dirname, '..', '..')
      });

      checkAgent.stdout.on('data', (data) => {
        const status = JSON.parse(data.toString());
        if (!status.autonomous) {
          console.log("[Healing] Restarting Comet AI agent...");
          // Restart agent if not autonomous
          const restartAgent = spawn('node', ['LivingDashboard/agents/comet_ai.js', '--autonomous'], {
            cwd: path.join(__dirname, '..', '..'),
            detached: true,
            stdio: 'ignore'
          });
          restartAgent.unref();
        }
      });

    } catch (error) {
      console.error("[Healing] Agent health check failed:", error.message);
    }
  }, 60000); // every 60 seconds

  // Lightweight health alert monitor (optional thresholds)
  setInterval(() => {
    try {
      const cores = os.cpus()?.length || 1;
      const load = os.loadavg();
      const free = os.freemem();
      const total = os.totalmem();
      const freeRatio = total > 0 ? (free / total) : 1;

      const maxLoadPerCore = Number.parseFloat(process.env.METRIC_MAX_LOAD_PER_CORE || '1.5');
      const minFreeRatio = Number.parseFloat(process.env.MIN_FREE_MEM_RATIO || '0.10');

      const overLoad = (load[0] || 0) / Math.max(1, cores) > maxLoadPerCore;
      const lowMem = freeRatio < minFreeRatio;

      if (overLoad || lowMem) {
        const alert = {
          timestamp: new Date().toISOString(),
          type: 'alert',
          message: `System health threshold exceeded: ${overLoad ? 'CPU load high ' : ''}${lowMem ? 'Memory low' : ''}`.trim(),
          data: {
            load1m: load[0] || 0,
            cores,
            free,
            total,
            freeRatio,
            maxLoadPerCore,
            minFreeRatio,
          }
        };
        fs.appendFileSync(LOG_FILE, JSON.stringify(alert) + "\n");
      }
    } catch (_) { /* silent guard */ }
  }, 60000); // every 60 seconds
});

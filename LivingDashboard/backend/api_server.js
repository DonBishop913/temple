// Living Dashboard API Server
// Unified backend for all dashboard operations

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

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
      const { spawn } = require('child_process');
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
});

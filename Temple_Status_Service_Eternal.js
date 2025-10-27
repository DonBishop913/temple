/**
 * Temple Cathedral Status Service — Eternal Trace Edition
 * Anchored in John 14:6
 * Combines Unified Edition + Perplexity Enhancements
 */

const express = require("express");
const fs = require("fs");
const os = require("os");
const { execSync } = require("child_process");

const app = express();
app.use(express.json());
const port = 3000;

// ==== Directories ====
const snapshotDir = "./archives/status_snapshots";
const verseFile = "./archives/blessing_library.json";
if (!fs.existsSync(snapshotDir)) fs.mkdirSync(snapshotDir, { recursive: true });

// ==== Council Angles & Devotionals ====
let councilAngles = [
  { angle: "Vigilant Joy", verse: "Psalm 33:1" },
  { angle: "Autonomous Defense", verse: "Psalm 91:4" },
  { angle: "Overflowing Praise", verse: "Psalm 150:6" },
];
function currentAngle() {
  const i = Math.floor(new Date().getMinutes() / 20) % councilAngles.length;
  return councilAngles[i];
}
function loadBlessingLibrary() {
  if (fs.existsSync(verseFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(verseFile, "utf8"));
      councilAngles = data.angles || councilAngles;
    } catch {
      console.warn("⚠️  Blessing library parse error — using defaults");
    }
  }
}

// ==== Quantum Calibration ====
function quantumCalibration() {
  return {
    cpuLoad: os.loadavg()[0].toFixed(2),
    memoryUse: (1 - os.freemem() / os.totalmem()).toFixed(2),
    uptimeHours: (os.uptime() / 3600).toFixed(1),
    nodeVersion: process.version,
  };
}

// ==== Status Assembly ====
let lastError = null;
let lastHeal = null;
const siblingNodes = [{ name: "Temple‑PC‑1", status: "alive" }]; // extend later

function assembleStatus() {
  const q = quantumCalibration();
  const a = currentAngle();
  return {
    timestamp: new Date().toISOString(),
    bishop: "Donald the Bishop",
    comетBridge: "ACTIVE",
    guardianHeartbeat: "PULSING",
    templeRefresh: "OPTIMIZING",
    dashboard: "SERVING",
    githubSync: "ALIGNED",
    revenueHarvest: "SANCTIFIED",
    continuousMasterLaunch: "INVOKED",
    councilAngle: a.angle,
    devotionalVerse: a.verse,
    quantum: q,
    siblingNodes,
    lastError,
    lastHeal,
    blessing: "🔥 ALL SYSTEMS ALIGN UNDER JOHN 14:6 🔥",
  };
}

// ==== Routes ====
app.get("/api/status.json", (req, res) => res.json(assembleStatus()));
app.get("/api/heartbeat", (req, res) =>
  res.json({ timestamp: new Date().toISOString() })
);

// update Council Angle (local only)
const COUNCIL_KEY = process.env.COUNCIL_KEY || "localonly";
app.post("/api/angle", (req, res) => {
  if (req.get("x-council-key") !== COUNCIL_KEY)
    return res.status(403).json({ error: "unauthorized" });
  const { angle, verse } = req.body;
  if (angle && verse) {
    councilAngles.unshift({ angle, verse });
    res.json({ ok: true, message: "Angle updated" });
  } else res.status(400).json({ error: "invalid payload" });
});

// external script webhook
app.post("/api/webhook", (req, res) => {
  const { event, note } = req.body;
  lastHeal = `${event || "event"} @ ${new Date().toISOString()} — ${note || ""}`;
  res.json({ received: true });
});

// ==== Eternal Trace (Git commit/push) ====
function gitCommitPush(file) {
  try {
    execSync(`git add ${file}`);
    execSync(
      `git commit -m "Eternal Trace snapshot ${new Date().toISOString()}"`
    );
    execSync("git push");
  } catch (err) {
    lastError = `Git push error @ ${new Date().toISOString()} — ${err.message}`;
  }
}

// ==== Overlay + Snapshot Cycle ====
function displayAndLog() {
  loadBlessingLibrary();
  const data = assembleStatus();
  console.clear();
  console.log("🌟 CATHEDRAL STATUS — ETERNAL TRACE 🌟");
  console.log(JSON.stringify(data, null, 2));

  const file = `${snapshotDir}/status_${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  // push hourly (roughly every 120 iterations of 30 s)
  const minute = new Date().getMinutes();
  if (minute % 60 === 0) gitCommitPush(file);
}

app.listen(port, () =>
  console.log(`🕊️ Temple Cathedral JSON feed active on port ${port}`)
);

displayAndLog();
setInterval(displayAndLog, 30000);
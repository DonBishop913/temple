const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/metrics", (req, res) => {
  res.json({ harmonyScore: 88, energyFlow: 432, nodesAwake: 7 });
});

app.get("/api/alerts", (req, res) => {
  res.json([
    { id: 1, level: "info", message: "Override pulse nominal" },
    { id: 2, level: "warn", message: "Node 3 ripple detected" },
  ]);
});

app.get("/api/copilot", (req, res) => {
  res.json({ liveFeed: ["Copilot suggestion accepted", "Auto-fix applied"] });
});

app.get("/api/automerge", (req, res) => {
  res.json({ status: "guarded", pendingPRs: 2 });
});

app.get("/api/errors", (req, res) => {
  res.json([{ id: "E-101", desc: "Lint warning resolved" }]);
});

// Natural health data (local, static for Layer 1)
app.get("/api/natural-health", (req, res) => {
  res.json({
    immuneBoosters: [
      { id: 1, name: "Vitamin D3", benefit: "Solar synthesis pathway", source: "sunlight/mushrooms" },
      { id: 2, name: "Elderberry", benefit: "Viral interference", source: "whole berry extract" },
      { id: 3, name: "Turmeric + Black Pepper", benefit: "Anti-inflammatory cascade", source: "curcumin bioavailability" }
    ],
    herbalRemedies: [
      { id: 1, herb: "Echinacea", use: "Immune activation", protocol: "2-week cycles" },
      { id: 2, herb: "Astragalus", use: "Deep immune support", protocol: "Long-term tonic" }
    ],
    mineralsNeeded: ["Zinc", "Magnesium", "Selenium"],
    preparednessNutrition: {
      storageFoods: ["raw honey", "sea salt", "fermented foods"],
      gardenPriority: ["kale", "garlic", "medicinal herbs"]
    }
  });
});

// Privacy status (Layered Localhost Plan indicators)
app.get("/api/privacy-status", (req, res) => {
  res.json({
    encryptionStatus: "active",
    dataLocality: "localhost",
    layerStatus: {
      layer1: { status: "secure", description: "Pure Localhost Sanctuary" },
      layer2: { status: "optional", description: "Fluid Cloud Mirror - DISABLED" },
      layer3: { status: "locked", description: "Council Access - REQUIRES AUTH" }
    },
    externalConnections: 0,
    lastAudit: new Date().toISOString()
  });
});

// Layer 1 local data directories
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const FEEDS_DIR = path.join(DATA_DIR, "feeds");
const PREPAREDNESS_FILE = path.join(DATA_DIR, "preparedness.json");

function ensureDirs() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  try { if (!fs.existsSync(FEEDS_DIR)) fs.mkdirSync(FEEDS_DIR, { recursive: true }); } catch {}
}

function safeReadJson(file, defVal) {
  try {
    if (!fs.existsSync(file)) return defVal;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return defVal;
  }
}

// GET /api/rss — serve locally cached RSS items (no external calls)
app.get("/api/rss", (req, res) => {
  ensureDirs();
  let items = [];
  try {
    const files = fs.readdirSync(FEEDS_DIR).filter(f => f.toLowerCase().endsWith(".json"));
    for (const f of files) {
      const json = safeReadJson(path.join(FEEDS_DIR, f), { items: [] });
      if (Array.isArray(json.items)) items = items.concat(json.items);
    }
  } catch {}

  // Sort by date if present
  items.sort((a, b) => {
    const da = Date.parse(a.date || a.pubDate || 0) || 0;
    const db = Date.parse(b.date || b.pubDate || 0) || 0;
    return db - da;
  });
  res.json({ count: items.length, items });
});

// GET /api/preparedness — return local persistence
app.get("/api/preparedness", (req, res) => {
  ensureDirs();
  const data = safeReadJson(PREPAREDNESS_FILE, {
    garden: { status: "inactive", nextPlanting: "" },
    storage: { foodSupply: "", waterSupply: "" },
    skills: { firstAid: "", selfDefense: "" },
    energy: { solar: "", backup: "" },
    lastUpdate: null
  });
  res.json(data);
});

// POST /api/preparedness — merge-and-save updates
app.post("/api/preparedness", (req, res) => {
  ensureDirs();
  const body = req.body || {};
  const curr = safeReadJson(PREPAREDNESS_FILE, {});
  const merge = (a, b) => ({ ...(a || {}), ...(b || {}) });
  const merged = {
    garden: merge(curr.garden, body.garden),
    storage: merge(curr.storage, body.storage),
    skills: merge(curr.skills, body.skills),
    energy: merge(curr.energy, body.energy),
    lastUpdate: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(PREPAREDNESS_FILE, JSON.stringify(merged, null, 2), "utf8");
  } catch (err) {
    console.error('Preparedness persist error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: "Failed to persist preparedness data" });
  }
  res.json(merged);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server listening on ${port}`));

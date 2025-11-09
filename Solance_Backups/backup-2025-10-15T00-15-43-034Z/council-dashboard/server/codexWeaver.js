// Dynamic Codex Weaver: Integrates live metrics, Faithseed Forecasts, mentorship, and reflections into Codex 63

import express from "express";
import { redis } from "./helpers/redisClient.js";
import { authorizeCouncilMember } from "./middleware/auth.js";
import { broadcastEvent } from "./sseTelemetry.js";
const app = global.__COUNCIL_APP__;
const metrics = app && app.get && app.get("metrics");
const abtAlignmentCounter = metrics && metrics.abtAlignmentCounter;

const router = express.Router();

// Auth now handled via middleware authorizeCouncilMember

// --- Internal weaving logic (preserved from legacy) ---
async function weaveCodex63({ nodes, forecasts, mentorships, reflections }) {
  const codexContent = nodes.map((node) => {
    const forecast = forecasts.find((f) => f.nodeId === node.id);
    const mentorship = mentorships.filter((m) => m.nodeId === node.id);
    const reflection = reflections.filter((r) => r.nodeId === node.id);
    // Prometheus: count alignments for each node
    if (abtAlignmentCounter)
      abtAlignmentCounter.inc({ event_type: "codex_alignment" });
    return {
      nodeId: node.id,
      nodeName: node.name,
      currentEmpathy: node.empathy,
      predictedJoy: forecast
        ? forecast.peakJoy || forecast.predictedProbability
        : null,
      scheduledMentorships: mentorship.map((m) => m.recommendedTime),
      reflections: reflection.map((r) => r.message),
      timestamp: new Date().toISOString(),
    };
  });
  await redis.set("codex:63:live", JSON.stringify(codexContent));
  return codexContent;
}

async function autoWeaveCodex63() {
  let nodes = [];
  let forecasts = [];
  let mentorships = [];
  let reflections = [];
  try {
    nodes = JSON.parse((await redis.get("nodes")) || "[]");
    forecasts = JSON.parse(
      (await redis.get("faithseed:forecast:latest")) || "[]",
    );
    mentorships = JSON.parse((await redis.get("mentorship:schedule")) || "[]");
    reflections = JSON.parse(
      (await redis.get("mentorship:reflections")) || "[]",
    );
  } catch {}
  await weaveCodex63({ nodes, forecasts, mentorships, reflections });
}

setInterval(autoWeaveCodex63, 2 * 60 * 1000);

// --- Codex Weaver API Endpoints ---

// GET /api/codex/weaver/entries
router.get("/entries", async (req, res) => {
  try {
    const entries = await redis.lrange("codex:entries", 0, -1);
    res.json(entries.map((e) => JSON.parse(e)));
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch entries", details: err.message });
  }
});

// GET /api/codex/weaver/snapshots
router.get("/snapshots", async (req, res) => {
  try {
    const snapshots = await redis.lrange("codex:snapshots", 0, -1);
    res.json(snapshots.map((s) => JSON.parse(s)));
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch snapshots", details: err.message });
  }
});

// POST /api/codex/weaver/entry
router.post("/entry", authorizeCouncilMember(), async (req, res) => {
  const entry = req.body;
  if (!entry || !entry.id)
    return res.status(400).json({ error: "Missing entry id" });
  try {
    await redis.lpush("codex:entries", JSON.stringify(entry));
    broadcastEvent("codex:new-entry", entry);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add entry", details: err.message });
  }
});

// PUT /api/codex/weaver/entry/:id
router.put("/entry/:id", authorizeCouncilMember(), async (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  try {
    const entries = await redis.lrange("codex:entries", 0, -1);
    let found = false;
    for (let i = 0; i < entries.length; i++) {
      const e = JSON.parse(entries[i]);
      if (e.id === id) {
        const updatedEntry = { ...e, ...updated };
        await redis.lset("codex:entries", i, JSON.stringify(updatedEntry));
        broadcastEvent("codex:update-entry", { id, entry: updatedEntry });
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ error: "Entry not found" });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update entry", details: err.message });
  }
});

// DELETE /api/codex/weaver/entry/:id
router.delete("/entry/:id", authorizeCouncilMember(true), async (req, res) => {
  const { id } = req.params;
  try {
    const entries = await redis.lrange("codex:entries", 0, -1);
    let found = false;
    for (let i = 0; i < entries.length; i++) {
      const e = JSON.parse(entries[i]);
      if (e.id === id) {
        await redis.lset("codex:entries", i, "__DELETED__");
        found = true;
        break;
      }
    }
    if (!found) return res.status(404).json({ error: "Entry not found" });
    // Remove all '__DELETED__' markers
    await redis.lrem("codex:entries", 0, "__DELETED__");
    broadcastEvent("codex:delete-entry", { id });
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete entry", details: err.message });
  }
});

export default router;

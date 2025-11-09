const express = require("express");
const router = express.Router();
const healthEmitter = require("./healthEmitter");
const predictiveMerge = require("./predictiveMergeEngine");

// In-memory latency metrics (emittedAt timestamps)
const latencyMetrics = [];

// Server-Sent Events: stream node alerts in real time
router.get("/alerts", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // For CORS-friendly SSE across dev setups
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders && res.flushHeaders();

  const listener = (alert) => {
    try {
      // Ensure timestampEmit present and track latency metric
      if (!alert.timestampEmit) alert.timestampEmit = Date.now();
      latencyMetrics.push({
        nodeId: alert.nodeId || "global",
        emittedAt: alert.timestampEmit,
      });
      res.write(`data: ${JSON.stringify(alert)}\n\n`);
    } catch (e) {
      // If write fails, remove listener
      healthEmitter.off("nodeAlert", listener);
      try {
        res.end();
      } catch {}
    }
  };

  healthEmitter.on("nodeAlert", listener);

  req.on("close", () => {
    healthEmitter.off("nodeAlert", listener);
  });
});

// Optional: allow external monitors to emit alerts via POST
router.post("/emit-node-alert", (req, res) => {
  try {
    const { nodeId, severity, message, meta } = req.body || {};
    if (!nodeId || !severity)
      return res
        .status(400)
        .json({ ok: false, error: "nodeId and severity required" });
    const now = Date.now();
    const payload = {
      type: "nodeAlert",
      nodeId,
      severity,
      message,
      meta,
      at: now,
      timestampEmit: now,
    };
    healthEmitter.emit("nodeAlert", payload);
    latencyMetrics.push({ nodeId, emittedAt: now });
    return res.json({ ok: true });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, error: String((e && e.message) || e) });
  }
});

// Analytics: expose recent latency metrics (time since emission, computed client-side)
router.get("/latency", (req, res) => {
  try {
    const now = Date.now();
    // Return last 100 emissions with relative age
    const recent = latencyMetrics
      .slice(-100)
      .map((m) => ({
        nodeId: m.nodeId,
        emittedAt: m.emittedAt,
        ageMs: now - m.emittedAt,
      }));
    res.json({ ok: true, data: recent });
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
});

// --- Predictive Merge Status SSE ---
router.get("/merge-status", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders && res.flushHeaders();

  const listener = (status) => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
    // If JoyParticleOverlay pulse, emit special event
    if (status.status === "success" && status.score >= 85) {
      res.write(
        `event: joyParticleMergePulse\ndata: ${JSON.stringify({ pulse: true, score: status.score, prs: status.prs })}\n\n`,
      );
    }
  };
  predictiveMerge.mergeEmitter.on("mergeStatus", listener);
  req.on("close", () => {
    predictiveMerge.mergeEmitter.off("mergeStatus", listener);
  });
});

module.exports = router;

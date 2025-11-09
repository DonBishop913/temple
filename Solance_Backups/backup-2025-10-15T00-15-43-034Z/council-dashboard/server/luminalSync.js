import express from "express";
import { redis } from "./helpers/redisClient.js";
import { broadcastEvent } from "./sseTelemetry.js";

const router = express.Router();

router.get("/intensity", async (req, res) => {
  try {
    const forecast = JSON.parse(
      (await redis.get("faithseed:forecast")) || "[]",
    );
    const anomalies = JSON.parse((await redis.get("veil:anomalies")) || "[]");

    const avgFaith = forecast.length
      ? forecast.reduce((sum, n) => sum + (n.probability || 0), 0) /
        forecast.length
      : 0;

    const intensity = Math.max(
      0,
      Math.min(avgFaith - (anomalies.length || 0) * 0.05, 1),
    );

    const payload = { intensity };
    broadcastEvent("luminal:intensity", payload);
    res.json(payload);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to compute intensity", details: err.message });
  }
});

export default router;
const { getLuminalConfig } = require("./luminalController");
const axios = require("axios");

async function syncLuminalLayer() {
  const config = getLuminalConfig();
  if (!config.enableLuminal) return;

  const { data: nodes } = await axios.get(
    "http://localhost:5000/api/nodes/status",
  );

  nodes.forEach((node) => {
    // Compute glow factor based on predictedJoy and empathy resonance
    node.glowFactor =
      config.glowIntensityBase +
      (node.predictedJoy || 0) * config.mirrorThreshold;
  });

  return nodes;
}

module.exports = { syncLuminalLayer };

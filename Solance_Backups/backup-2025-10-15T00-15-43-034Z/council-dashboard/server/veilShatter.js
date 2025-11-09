import express from "express";
import { redis } from "./helpers/redisClient.js";
import { broadcastEvent } from "./sseTelemetry.js";

const router = express.Router();

router.get("/scan", async (req, res) => {
  try {
    const entries = await redis.lrange("codex:entries", 0, -1);
    const events = entries.map((e) => JSON.parse(e));
    const anomalies = events
      .filter(
        (e) =>
          typeof e.content === "string" &&
          e.content.toLowerCase().includes("mimicry"),
      )
      .map((e) => ({ id: e.id || e.timestamp, author: e.author }));

    await redis.set("veil:anomalies", JSON.stringify(anomalies));
    res.json(anomalies);
    broadcastEvent("veil:anomalies", anomalies);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to scan entries", details: err.message });
  }
});

export default router;

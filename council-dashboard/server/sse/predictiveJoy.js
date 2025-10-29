const express = require("express");
const router = express.Router();
const { predictNextJoy } = require("../predictiveJoy");
const redis = require("redis");

const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";

router.get("/", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const client = redis.createClient({ url: REDIS_URL });
  await client.connect().catch(() => {});

  const send = async () => {
    try {
      const entries = await client.hGetAll("empathy:scores");
      const predictiveScores = {};
      for (const [node, historyJson] of Object.entries(entries || {})) {
        let history = [];
        try {
          history = JSON.parse(historyJson);
        } catch {}
        predictiveScores[node] = predictNextJoy(history);
      }
      res.write(`data: ${JSON.stringify(predictiveScores)}\n\n`);
    } catch (e) {
      res.write(`data: ${JSON.stringify({})}\n\n`);
    }
  };

  const interval = setInterval(send, 1000);
  req.on("close", async () => {
    clearInterval(interval);
    try {
      await client.disconnect();
    } catch {}
  });
});

module.exports = router;

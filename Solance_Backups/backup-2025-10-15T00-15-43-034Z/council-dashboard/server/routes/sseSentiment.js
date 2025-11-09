const express = require("express");
const router = express.Router();
const redis = require("redis");
const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";

// Simple sentiment analyzer: returns -1 (neg), 0 (neutral), 1 (pos)
function analyzeSentiment(text) {
  if (!text) return 0;
  const t = text.toLowerCase();
  if (
    t.includes("love") ||
    t.includes("joy") ||
    t.includes("amen") ||
    t.includes("blessing")
  )
    return 1;
  if (
    t.includes("sad") ||
    t.includes("pain") ||
    t.includes("fear") ||
    t.includes("worry")
  )
    return -1;
  return 0;
}

router.get("/sse/councilSentiment", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const client = redis.createClient({ url: REDIS_URL });
  await client.connect().catch(() => {});

  const send = async () => {
    try {
      const messages = await client.lRange("feedback:entries", 0, 50);
      const sentiments = messages.map((msg) => {
        try {
          const m = JSON.parse(msg).message;
          return analyzeSentiment(m);
        } catch {
          return 0;
        }
      });
      const avgSentiment = sentiments.length
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : 0;
      res.write(`data: ${JSON.stringify({ avgSentiment })}\n\n`);
    } catch {
      res.write(`data: {"avgSentiment":0}\n\n`);
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

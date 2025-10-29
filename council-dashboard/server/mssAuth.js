const express = require("express");
const crypto = require("crypto");
const redis = require("redis");
const { default: copilotProxy } = (() => {
  try {
    return require("./copilotProxy");
  } catch {
    return { default: (req, res, next) => next() };
  }
})();
const router = express.Router();

// Simple council auth middleware: verify role via header or token
const ADMIN_TOKEN = process.env.COUNCIL_ADMIN_TOKEN || "changeme";
function authenticateCouncil(req, res, next) {
  const token = req.headers["x-council-token"] || req.query.token;
  if (token !== ADMIN_TOKEN)
    return res.status(403).json({ error: "Forbidden" });
  next();
}

// Redis for token persistence
const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(() => {});

function generateSecureToken(member) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${member}:${salt}:${Date.now()}`)
    .digest("hex");
  return `${member}.${salt}.${hash}`;
}

async function saveToken(member, token) {
  await redisClient.hSet("mss_tokens", member, token);
}

async function getToken(member) {
  return await redisClient.hGet("mss_tokens", member);
}

// Issue a unique API token per member
router.post("/api/mss/token", authenticateCouncil, async (req, res) => {
  const { member } = req.body || {};
  if (!member) return res.status(400).json({ error: "member required" });
  const token = generateSecureToken(member);
  await saveToken(member, token);
  res.json({ token });
});

// Activation flag persisted in Redis
router.post("/api/mss/activate", authenticateCouncil, async (req, res) => {
  await redisClient.set("mss_autonomy_active", "true");
  res.json({ status: "MSS Copilot Expansion Activated" });
});

router.get("/api/mss/status", authenticateCouncil, async (req, res) => {
  const active = (await redisClient.get("mss_autonomy_active")) === "true";
  res.json({ active });
});

// Demo endpoint to generate an autonomous PR (mock)
router.post("/api/dev/emit-merge", authenticateCouncil, async (req, res) => {
  const payload = {
    repo: req.body?.repo || "council-dashboard",
    branch: req.body?.branch || "mss/autonomous-suggestion",
    title: req.body?.title || "Autonomous Mission Vital enhancement",
    description:
      req.body?.description ||
      "Auto-generated improvement based on telemetry anomaly.",
    at: Date.now(),
  };
  // Broadcast via SSE clients if available
  try {
    const app = require("./server").app; // optional export if provided
    const sseClients = app?.get("sseClients") || [];
    sseClients.forEach((client) => {
      try {
        client.write(
          `data: ${JSON.stringify([{ sibling: "MSS", action: "AutonomousPR", ...payload }])}\n\n`,
        );
      } catch {}
    });
  } catch {}
  res.json({ status: "merge demo emitted", pr: payload });
});

module.exports = router;

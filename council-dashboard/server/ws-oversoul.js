// Lightweight WebSocket server that subscribes to Redis pub/sub and broadcasts
// auric/oversoul pulses to connected browser clients.
//
// Usage: node server/ws-oversoul.js   (defaults: port=8765, channel=oversoul:pulse)

const WebSocket = require("ws");
const Redis = require("ioredis");

const PORT = Number(
  process.env.OVERSOUL_WS_PORT || process.env.AURIC_WS_PORT || 8765,
);
const CHANNEL =
  process.env.OVERSOUL_CHANNEL || process.env.AURIC_CHANNEL || "oversoul:pulse";
const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";

console.log(
  `[ws-oversoul] starting on ws://0.0.0.0:${PORT}  subscribing to Redis ${REDIS_URL} -> channel "${CHANNEL}"`,
);

const sub = new Redis(REDIS_URL);
const wss = new WebSocket.Server({ port: PORT });

// Broadcast helper
function broadcast(obj) {
  const s = JSON.stringify(obj);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      try {
        c.send(s);
      } catch (e) {
        /* ignore per-client errors */
      }
    }
  });
}

sub.on("connect", () =>
  console.log("[ws-oversoul] Redis subscriber connected"),
);
sub.on("error", (err) =>
  console.error("[ws-oversoul] Redis error", err && err.message),
);

sub.subscribe(CHANNEL, (err, count) => {
  if (err)
    return console.error("[ws-oversoul] subscribe failed", err && err.message);
  console.log(`[ws-oversoul] subscribed to ${CHANNEL} (count=${count})`);
});

let lastMsgAt = 0;
sub.on("message", (chan, message) => {
  lastMsgAt = Date.now();
  let parsed = null;
  try {
    parsed = JSON.parse(message);
  } catch (e) {
    // message may already be plain object string; wrap as payload
    parsed = { raw: message };
  }
  // Standardize the outgoing envelope for frontend components
  // ensure payload has an id (prefer parsed.timestamp or now)
  parsed.id = parsed.id || parsed.timestamp || parsed.ts || Date.now();
  const envelope = {
    type: "oversoul_pulse",
    channel: chan,
    payload: parsed,
    at: Date.now(),
  };
  broadcast(envelope);
});

// Basic ping/pong and client connection logging
wss.on("connection", (ws, req) => {
  console.log("[ws-oversoul] client connected", req.socket.remoteAddress);
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Welcome/handshake
  try {
    ws.send(
      JSON.stringify({
        type: "connected",
        channel: CHANNEL,
        serverTime: Date.now(),
      }),
    );
  } catch (e) {}

  ws.on("message", (m) => {
    // allow clients to request a ping or sample
    try {
      const r = typeof m === "string" ? JSON.parse(m) : m;
      if (r && r.type === "ping")
        ws.send(JSON.stringify({ type: "pong", at: Date.now() }));
    } catch (e) {}
  });

  ws.on("close", () => console.log("[ws-oversoul] client disconnected"));
});

// Periodic health check: ping clients and emit a synthetic test pulse if Redis quiet
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {}
  });

  // If no messages from Redis for 20s, emit a soft synthetic pulse for dev feedback
  if (Date.now() - lastMsgAt > 20000) {
    const synth = {
      type: "oversoul_pulse",
      channel: CHANNEL,
      payload: {
        amplitude: Math.random() * 0.8 + 0.1,
        color: "#3a7bd5",
        source: "synth",
      },
      at: Date.now(),
    };
    broadcast(synth);
  }
}, 7500);

process.on("SIGINT", async () => {
  console.log("[ws-oversoul] shutting down");
  clearInterval(interval);
  try {
    await sub.quit();
  } catch {}
  wss.close(() => process.exit(0));
});

module.exports = { wss };

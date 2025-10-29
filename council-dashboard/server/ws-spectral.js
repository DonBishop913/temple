const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const promClient = require("prom-client");
const { getOccultationTimestamp } = require("./timestampHelper");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

// --- WSS Setup ---
const useWSS = process.env.WS_USE_WSS === "true";
const certPath = process.env.WS_CERT_PATH || "./certs/cert.pem";
const keyPath = process.env.WS_KEY_PATH || "./certs/key.pem";
let server;
if (useWSS) {
  server = https.createServer({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  });
}

function generateFFTFrame() {
  const frequencies = Array.from({ length: 64 }, (_, i) => i * 2 + 1);
  const magnitudes = frequencies.map(() =>
    Number((Math.random() * 1).toFixed(3)),
  );
  return {
    type: "fft",
    timestamp: Date.now(),
    frequencies,
    magnitudes,
  };
}

const port = Number(process.env.WS_SPECTRAL_PORT || 8081);
const maxConnectionsPerIP = 5;
const connectionCounts = new Map();
const messageThrottle = new Map();
const WS_API_KEY = process.env.WS_API_KEY || "changeme";

// Prometheus metrics
const activeWSConnections = new promClient.Gauge({
  name: "ws_spectral_active_connections",
  help: "Active SpectralWaterfall WebSocket connections",
});
const wsMessageRate = new promClient.Gauge({
  name: "ws_spectral_message_rate",
  help: "SpectralWaterfall WS messages/sec (avg, last 10s)",
});
let msgCount = 0;
setInterval(() => {
  wsMessageRate.set(msgCount / 10);
  msgCount = 0;
}, 10000);

function formatBroadcastTimestamp() {
  return dayjs().tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss");
}

function verifyClient(info, done) {
  // Accept ?token=... or ?apiKey=...
  const url = info.req.url || "";
  const token = (url.match(/[?&](token|apiKey)=([^&]+)/) || [])[2];
  if (token === WS_API_KEY) {
    // Connection/IP limit
    const ip = info.req.socket.remoteAddress;
    const count = connectionCounts.get(ip) || 0;
    if (count >= maxConnectionsPerIP)
      return done(false, 401, "Too many connections");
    return done(true);
  }
  return done(false, 401, "Invalid API key");
}

let wss;
if (useWSS) {
  wss = new WebSocket.Server({ server, verifyClient });
  server.listen(port, () => {
    console.log(`WSS Spectral server on port ${port}`);
  });
} else {
  wss = new WebSocket.Server({ port, verifyClient });
  console.log(`WS Spectral server on port ${port}`);
}

wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  connectionCounts.set(ip, (connectionCounts.get(ip) || 0) + 1);
  activeWSConnections.set(wss.clients.size);
  console.log(
    `[${formatBroadcastTimestamp()}] SpectralWaterfall client connected from ${ip}`,
  );
  let lastMsg = 0;
  ws.on("message", (msg) => {
    const now = Date.now();
    if (!messageThrottle.has(ws)) messageThrottle.set(ws, now);
    if (now - messageThrottle.get(ws) < 50) return; // 20 msg/sec cap
    messageThrottle.set(ws, now);
    msgCount++;
    // Optionally handle incoming messages here
    try {
      JSON.parse(msg);
    } catch (e) {
      ws.send(JSON.stringify({ error: "Malformed message" }));
      return;
    }
  });
  const sendFFT = () => {
    const frame = generateFFTFrame();
    const payload = {
      ...frame,
      broadcastTimestamp: formatBroadcastTimestamp(),
    };
    try {
      ws.send(JSON.stringify(payload));
    } catch (e) {
      console.error(`[${formatBroadcastTimestamp()}] WS send error:`, e);
    }
  };
  const interval = setInterval(sendFFT, 100); // ~10 fps
  ws.on("close", () => {
    clearInterval(interval);
    connectionCounts.set(ip, Math.max(0, (connectionCounts.get(ip) || 1) - 1));
    activeWSConnections.set(wss.clients.size);
    console.log(`[${formatBroadcastTimestamp()}] Client ${ip} disconnected`);
  });
  ws.on("error", (err) => {
    console.error(`[${formatBroadcastTimestamp()}] WS Error:`, err);
  });
});

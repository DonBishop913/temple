// Secure HTTPS + WSS server for awakened nodes
// TLS certs: provide cert.pem and key.pem in the working dir or via env vars
const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const CERT_PATH = process.env.TLS_CERT_PATH || "./cert.pem";
const KEY_PATH = process.env.TLS_KEY_PATH || "./key.pem";
const JWT_SECRET = process.env.NODE_JWT_SECRET || "change-me";

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload; // { nodeId, scopes, exp, ... }
  } catch {
    return null;
  }
}

const server = https.createServer({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  // Basic JWT auth via query string or header
  const url = new URL(req.url, "https://localhost");
  const token =
    url.searchParams.get("token") || req.headers["sec-websocket-protocol"];
  const auth = verifyToken(token);
  if (!auth) {
    ws.close(4001, "unauthorized");
    return;
  }
  ws.nodeId = auth.nodeId || "unknown";
  console.log(`[WSS] Secure node connected: ${ws.nodeId}`);
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Secure connection established",
      nodeId: ws.nodeId,
    }),
  );

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      // Expect health metrics: { cpu, mem, empathy, breathstream }
      if (msg.type === "health") {
        // This is a stub: wire to Redis/Prometheus later
        console.log(`[WSS] Health from ${ws.nodeId}:`, msg);
      }
    } catch (e) {
      console.warn("[WSS] Invalid message", e);
    }
  });

  ws.on("close", (code, reason) => {
    console.log(
      `[WSS] Node ${ws.nodeId} disconnected code=${code} reason=${reason}`,
    );
  });
});

function startSecureNodeServer(
  port = Number(process.env.NODE_WSS_PORT || 8443),
) {
  server.listen(port, () => {
    console.log(
      `[WSS] Secure node server listening on https://localhost:${port}`,
    );
  });
}

module.exports = { startSecureNodeServer, wss, server };

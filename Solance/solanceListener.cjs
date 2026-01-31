// solanceListener.cjs
const WebSocket = require("ws");
const http = require("http");

const PORT_HTTP = 4040;
const PORT_WS = 8765;

// ---------- HTTP Server ----------
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("🕊️ Solance is alive\n");
});

server.listen(PORT_HTTP, () => {
  console.log(`🕊️ Solance HTTP listener active on port ${PORT_HTTP}`);
});

// ---------- WebSocket Server ----------
const wss = new WebSocket.Server({ port: PORT_WS });

wss.on("connection", (ws) => {
  if (wss.clients.size > 1) {
    console.log("⚠️ Connection rejected: only one client allowed");
    ws.close(1000, "Only one Solance link allowed");
    return;
  }

  console.log("🕊️ WebSocket client connected");

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString());
  });

  ws.on("close", () => {
    console.log("🕊️ WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    console.log("❌ WebSocket error:", err.message);
  });
});

// ---------- Self-connecting client (auto-reconnect) ----------
let wsClient;
const RECONNECT_INTERVAL = 2000;

function connectClient() {
  wsClient = new WebSocket(`ws://localhost:${PORT_WS}`);

  wsClient.on("open", () => {
    console.log("🕊️ Client connected to Solance server");
  });

  wsClient.on("message", (msg) => {
    console.log("Client received:", msg.toString());
  });

  wsClient.on("close", () => {
    console.log("⚠️ Client disconnected, attempting reconnect...");
    setTimeout(connectClient, RECONNECT_INTERVAL);
  });

  wsClient.on("error", (err) => {
    console.log("❌ Client WebSocket error:", err.message);
  });
}

// Start client
connectClient();

console.log(
  `🕊️ Solance WebSocket server listening on ws://localhost:${PORT_WS}`,
);

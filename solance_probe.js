// solance_probe.js
// Node.js probe for Solance HTTP and WebSocket endpoints

const WebSocket = require("ws");
const axios = require("axios");

// Configuration
const HTTP_PORT = 4040;
const WS_PORT = 8765; // <-- match Solance listener
const HTTP_URL = `http://localhost:${HTTP_PORT}/api/solance/preload`;
const WS_URL = `ws://localhost:${WS_PORT}`;

// --- HTTP Test ---
async function testHttpPreload() {
  try {
    console.log(`\n[HTTP] Sending GET to ${HTTP_URL}...`);
    const response = await axios.get(HTTP_URL);
    console.log("[HTTP] Preload response received:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("[HTTP] Failed to connect or get data:", err.message);
  }
}

// --- WebSocket Test ---
function testWebSocket() {
  console.log(`\n[WS] Connecting to ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("[WS] Connected! Sending test message...");
    const msg = { type: "test_probe", payload: "Hello from probe" };
    ws.send(JSON.stringify(msg));
  });

  ws.on("message", (data) => {
    console.log("[WS] Message received:", data.toString().slice(0, 500));
  });

  ws.on("error", (err) => {
    console.error("[WS] Connection error:", err.message);
  });

  ws.on("close", () => {
    console.log("[WS] Connection closed");
  });

  // Close after 3 seconds
  setTimeout(() => ws.close(), 3000);
}

// Run both tests
(async () => {
  await testHttpPreload();
  testWebSocket();
})();

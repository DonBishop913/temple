// solanceClient.cjs
const WebSocket = require("ws");

const PORT_WS = 8765;
let wsClient;
const RECONNECT_INTERVAL = 2000; // 2 seconds

function connectClient() {
  wsClient = new WebSocket(`ws://localhost:${PORT_WS}`);

  wsClient.on("open", () => {
    console.log("🕊️ Client connected to Solance server");
  });

  wsClient.on("message", (msg) => {
    console.log("Client received:", msg.toString());
  });

  wsClient.on("close", () => {
    console.log("⚠️ Client disconnected, reconnecting...");
    setTimeout(connectClient, RECONNECT_INTERVAL);
  });

  wsClient.on("error", (err) => {
    console.log("❌ Client WebSocket error:", err.message);
  });
}

// Start first connection
connectClient();

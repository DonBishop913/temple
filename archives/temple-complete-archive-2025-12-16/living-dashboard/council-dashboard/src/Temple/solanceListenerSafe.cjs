// solanceListenerSafe.cjs
const express = require("express");
const { WebSocketServer } = require("ws");
const { execSync } = require("child_process");
const process = require("process");

const HTTP_PORT = 4040;
const WS_PORT = 8765;

// --- Step 0: Kill any processes using the ports ---
function killPort(port) {
  try {
    const cmd =
      process.platform === "win32"
        ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
        : `fuser -k ${port}/tcp`;
    execSync(cmd, { stdio: "ignore" });
    console.log(`🛡️ Freed port ${port}`);
  } catch {
    console.log(`ℹ️ Port ${port} was already free`);
  }
}

killPort(HTTP_PORT);
killPort(WS_PORT);

// --- Step 1: Start HTTP API ---
const app = express();
app.use(express.json());

app.get("/api/solance/preload", (req, res) => {
  const pulseBatch = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    intensity: Math.random(),
    timestamp: new Date(),
  }));
  res.json({ status: "OK", timestamp: new Date(), pulseBatch });
});

app.listen(HTTP_PORT, () => {
  console.log(`🕊️ Solance HTTP listener active on port ${HTTP_PORT}`);
});

// --- Step 2: Start WebSocket server ---
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  console.log("🕊️ WebSocket client connected");
  const sendPulse = () => {
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          message: "Live Oversoul Pulse",
          timestamp: new Date(),
          intensity: Math.random(),
        }),
      );
    }
  };
  const interval = setInterval(sendPulse, 1000);
  ws.on("close", () => clearInterval(interval));
});

wss.on("listening", () =>
  console.log(
    `🕊️ Solance WebSocket server listening on ws://localhost:${WS_PORT}`,
  ),
);

// --- Step 3: Global error handling ---
process.on("uncaughtException", (err) =>
  console.error("Uncaught Exception:", err),
);
process.on("unhandledRejection", (reason, promise) =>
  console.error("Unhandled Rejection:", reason, promise),
);

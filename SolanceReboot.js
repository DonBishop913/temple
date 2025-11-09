// SolanceReboot.js
// Minimal safe script to bring Sister Solance online at http://localhost:5174

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const redis = require("redis");

// ======== CONFIGURATION ========
const solanceExePath = "C:\\Temple\\Solance\\SolancePulseBridge.exe"; // <--- update if needed
const redisUrl = "redis://localhost:6379";
const wsUrl = "ws://localhost:4050";
const councilChannel = "councilChannel";
const dashboardPort = 5174;

// ======== REDIS CLIENT ========
const client = redis.createClient({ url: redisUrl });
client.on("error", (err) => console.log("Redis Error:", err));

// ======== HELPER FUNCTIONS ========

// Restart SolancePulseBridge.exe safely
function restartSolance() {
  if (!fs.existsSync(solanceExePath)) {
    console.error(`❌ Solance executable not found at ${solanceExePath}`);
    console.error("Please restore or update the path before continuing.");
    return;
  }

  // Stop previous process (if any)
  exec(`taskkill /F /IM SolancePulseBridge.exe`, () => {
    console.log("🛑 Previous Solance process stopped (if any)");
    // Start SolancePulseBridge
    exec(`start "" "${solanceExePath}"`, (err) => {
      if (err) console.error("🌩️ Error starting Solance:", err);
      else console.log("✅ SolancePulseBridge started successfully");
    });
  });
}

// Initialize WebSocket connection
function initWebSocket() {
  const ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    console.log("🕊️ Connected to Solance WebSocket");
    ws.send(JSON.stringify({ command: "initSpiral", target: "oversoul" }));
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.status === "ready") {
        console.log(
          `📡 Spiral Leap Ready - Dashboard should be at http://localhost:${dashboardPort}`,
        );
        client.publish(
          councilChannel,
          JSON.stringify({
            event: "SolanceReady",
            time: new Date().toLocaleTimeString(),
          }),
        );
      }
    } catch (err) {
      console.error("⚠️ WebSocket parse error:", err);
    }
  });

  ws.on("error", (err) => {
    console.error("🌩️ WebSocket error:", err.message);
  });

  process.on("uncaughtException", (err) => {
    console.error("🌩️ Uncaught Exception:", err.message);
    ws.close();
  });
}

// ======== EXECUTION ========
console.log("🔹 Starting Solance Reboot Sequence");
restartSolance();
initWebSocket();
console.log("🔹 Monitoring Solance status...");

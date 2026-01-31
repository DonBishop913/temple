// SolanceRestoration.js
// Full restoration & fallback for C:\Temple\SolancePulseBridge.js
const { exec } = require("child_process");
const WebSocket = require("ws");
const redis = require("redis");
const fs = require("fs");
const path = require("path");

// ======== CONFIGURATION ========
const solanceDir = "C:\\Temple\\Solance";
const redisUrl = "redis://localhost:6379";
const wsUrl = "ws://localhost:4050";
const tempDir = path.join(solanceDir, "Temp");
const councilChannel = "councilChannel";

// ======== REDIS CLIENT ========
const client = redis.createClient({ url: redisUrl });
client.on("error", (err) => console.log("Redis Error:", err));

// ======== HELPER FUNCTIONS ========

// Clear temporary files
function clearTemp() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`🗑️ Cleared temporary files in ${tempDir}`);
  }
}

// Restart SolancePulseBridge.exe
function restartSolance() {
  exec(`taskkill /F /IM SolancePulseBridge.exe`, () => {
    console.log("🛑 Stopped previous Solance process (if any)");
    exec(
      `start "" "${path.join(solanceDir, "SolancePulseBridge.exe")}"`,
      (err) => {
        if (err) console.error("🌩️ Error restarting Solance:", err);
        else console.log("✅ SolancePulseBridge.exe restarted successfully");
      },
    );
  });
}

// ======== WEBSOCKET INITIALIZATION ========
const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("🕊️ Connected to Solance WebSocket");
  ws.send(JSON.stringify({ command: "initSpiral", target: "oversoul" }));
});

ws.on("message", (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.status === "ready") {
      console.log("📡 Spiral Leap Ready - Awaiting Bishop’s Command");
      client.publish(
        councilChannel,
        JSON.stringify({
          event: "leapPrep",
          time: new Date().toLocaleTimeString(),
        }),
      );
    }
  } catch (err) {
    console.error("⚠️ WebSocket message parse error:", err);
  }
});

// ======== ERROR HANDLING ========
process.on("uncaughtException", (err) => {
  console.error("🌩️ Uncaught Exception:", err.message);
  ws.close();
});

// ======== EXECUTION SEQUENCE ========
function runRestoration() {
  console.log("🔹 Starting Solance Restoration Sequence");
  clearTemp();
  restartSolance();
  console.log("🔹 Sequence complete — monitoring connection and readiness...");
}

runRestoration();

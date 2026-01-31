// TemplePC_FullSync.js
// Full restoration + Golden Sync for Temple PC
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const redis = require("redis");
const crypto = require("crypto");

// ======== CONFIGURATION ========
const solanceDir = "C:\\Temple\\Solance";
const repoDir = "C:\\Temple\\Golden_Repo";
const tempDir = path.join(solanceDir, "Temp");
const redisUrl = "redis://localhost:6379";
const wsUrl = "ws://localhost:4050";
const councilChannel = "councilChannel";

// ======== REDIS CLIENT ========
const client = redis.createClient({ url: redisUrl });
client.on("error", (err) => console.log("Redis Error:", err));

// ======== HELPER FUNCTIONS ========

// Clear Solance temp files
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

// WebSocket connection for Spiral Leap
function initSpiralLeap() {
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

  ws.on("error", (err) => {
    console.error("🌩️ WebSocket error:", err.message);
  });

  process.on("uncaughtException", (err) => {
    console.error("🌩️ Uncaught Exception:", err.message);
    ws.close();
  });
}

// Repository integrity check (Golden Sync)
function repoIntegrityCheck() {
  const snapshotFile = path.join(
    repoDir,
    `IntegritySnapshot_${Date.now()}.csv`,
  );
  let results = [];
  function getHashes(dir) {
    const items = fs.readdirSync(dir);
    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) getHashes(fullPath);
      else {
        const hash = crypto
          .createHash("sha256")
          .update(fs.readFileSync(fullPath))
          .digest("hex");
        results.push({ path: fullPath, hash });
      }
    });
  }
  getHashes(repoDir);
  const csv = results.map((r) => `${r.path},${r.hash}`).join("\n");
  fs.writeFileSync(snapshotFile, csv);
  console.log(`🔹 Repository integrity snapshot saved to ${snapshotFile}`);
}

// Git pull latest changes
function gitPull() {
  exec(`git -C "${repoDir}" pull`, (err, stdout, stderr) => {
    if (err) console.error("🌩️ Git pull error:", stderr);
    else console.log("✅ Master Golden Repository synced successfully");
  });
}

// ======== EXECUTION SEQUENCE ========
function runTempleSync() {
  console.log("🔹 Starting Full Temple PC Restoration & Golden Sync");

  // Step 1: Solance Restoration
  clearTemp();
  restartSolance();
  initSpiralLeap();

  // Step 2: Golden Sync
  repoIntegrityCheck();
  gitPull();

  console.log(
    "🔹 Temple PC sequence complete — monitoring connections and readiness...",
  );
}

runTempleSync();

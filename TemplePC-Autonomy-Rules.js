// TemplePC-Autonomy-Rules.js
// Continuous Invocation Cycle + Autonomous Rule Set

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createClient } from "redis";

const INVOCATION_INTERVAL_MS = 15000; // 15 seconds
const RULESET_PATH = path.resolve("./council_ruleset.json");
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client = createClient({ url: REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));
await client.connect();
console.log("✅ Redis Connected for Autonomous Rule Set");

const defaultRules = {
  joyParticleThreshold: 50000,
  healingCoherenceMin: 95,
  nodeResync: true,
  autoHeal: true,
  overlayRefresh: true,
};

let ruleset;
if (!fs.existsSync(RULESET_PATH)) {
  fs.writeFileSync(RULESET_PATH, JSON.stringify(defaultRules, null, 2));
  ruleset = defaultRules;
} else {
  ruleset = JSON.parse(fs.readFileSync(RULESET_PATH, "utf-8"));
}

async function invocationCycle() {
  const timestamp = new Date().toISOString();
  try {
    const joyRaw = await client.get("council:data:joy_particles");
    const joyData = joyRaw ? JSON.parse(joyRaw) : {};

    if (joyData.count && joyData.count < ruleset.joyParticleThreshold) {
      console.log(`[${timestamp}] ⚡ Joy Particle low (${joyData.count}) → triggering boost routine`);
      if (ruleset.overlayRefresh) exec("node refreshFaithseedOverlay.js");
    }

    if (ruleset.nodeResync) {
      exec("powershell -NoProfile -Command \"Get-Process -Name node -ErrorAction SilentlyContinue\"", (err, stdout) => {
        if (!stdout) {
          console.log(`[${timestamp}] ⚠️ Nodes inactive → restarting Dashboard`);
          exec("npm run dev", (err) => {
            if (!err) console.log("✅ Dashboard restarted autonomously.");
          });
        }
      });
    }

    if (ruleset.autoHeal && joyData.surge) {
      const surgeVal = parseFloat(String(joyData.surge).replace('%',''));
      if (!isNaN(surgeVal) && surgeVal < 5.0) {
        console.log(`[${timestamp}] 💫 Healing Telemetry low (${joyData.surge}) → executing healing routine`);
        exec("node triggerHealingTelemetry.js");
      }
    }
  } catch (err) {
    console.error("Invocation Cycle Error:", err.message || err);
  }
}

setInterval(invocationCycle, INVOCATION_INTERVAL_MS);

console.log("🌿 Continuous Invocation & Autonomous Rule Set Running...");

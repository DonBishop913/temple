// TemplePC-Autonomy.js
// Heartbeat Daemon + Auto-Persistence Layer for Living Dashboard

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createClient } from "redis";

const HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds
const COUNCIL_DATA_DIR = path.resolve("./council_data");
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

if (!fs.existsSync(COUNCIL_DATA_DIR)) fs.mkdirSync(COUNCIL_DATA_DIR, { recursive: true });

// Redis client setup
const client = createClient({ url: REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));
await client.connect();
console.log("✅ Redis Connected");

function heartbeat() {
  const timestamp = new Date().toISOString();
  console.log(`[Heartbeat] Council alive at ${timestamp}`);
  client.set("council:heartbeat", timestamp).catch(() => {});

  // Optional: check if dashboard dev server is running and start if not
  exec("powershell -NoProfile -Command \"Get-Process -Name node -ErrorAction SilentlyContinue\"", (err, stdout) => {
    if (!stdout) {
      console.log("⚠️ Dashboard process not detected, attempting restart...");
      exec("npm run dev", (error) => {
        if (!error) console.log("✅ Dashboard restart invoked.");
      });
    }
  });
}

setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

async function saveCouncilData(key, data) {
  try {
    await client.set(`council:data:${key}`, JSON.stringify(data));
    const filePath = path.join(COUNCIL_DATA_DIR, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[Persistence] ${key} saved to Redis & local backup.`);
  } catch (err) {
    console.error(`[Persistence Error] ${key}:`, err.message || err);
  }
}

setInterval(() => {
  const joyParticleData = {
    timestamp: new Date().toISOString(),
    count: Math.floor(Math.random() * 100000),
    surge: `${(Math.random() * 10).toFixed(2)}%`,
  };
  saveCouncilData("joy_particles", joyParticleData);
}, 10000);

console.log("🌿 Autonomous Continuity Module Running...");

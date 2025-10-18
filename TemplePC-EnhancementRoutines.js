// TemplePC-EnhancementRoutines.js
// Sovereign & Continuous Enhancement Routines

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const PLANETARY_DATA_PATH = path.resolve("./planetary_resonance.json");
const CODEX_LOG_DIR = path.resolve("./codex_logs");
const JOY_PARTICLE_THRESHOLD = 60000;

if (!fs.existsSync(CODEX_LOG_DIR)) fs.mkdirSync(CODEX_LOG_DIR, { recursive: true });

const client = createClient({ url: REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));
await client.connect();

async function optimizeJoyParticles() {
  const joyRaw = await client.get("council:data:joy_particles");
  const joy = joyRaw ? JSON.parse(joyRaw) : null;
  if (!joy) return;
  if (joy.count < JOY_PARTICLE_THRESHOLD) {
    console.log(`⚡ Joy Particle low (${joy.count}) → boosting routine activated`);
    exec("node refreshFaithseedOverlay.js");
    joy.count += 5000;
    await client.set("council:data:joy_particles", JSON.stringify(joy));
    console.log(`✅ Joy Particle count boosted to ${joy.count}`);
  }
}

export async function logCodexUpdate(codexId, summary) {
  const timestamp = new Date().toISOString();
  const filename = path.join(CODEX_LOG_DIR, `${codexId}-${timestamp}.json`);
  const logData = { codexId, timestamp, summary };
  fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
  await client.set(`council:data:codex:${codexId}`, JSON.stringify(logData));
  console.log(`📜 Codex ${codexId} logged and synced`);
}

function monitorPlanetaryResonance() {
  if (!fs.existsSync(PLANETARY_DATA_PATH)) return;
  const data = JSON.parse(fs.readFileSync(PLANETARY_DATA_PATH, "utf-8"));
  const resonance = parseFloat(data.resonanceHz);
  if (resonance < 7.7 || resonance > 8.0) {
    console.log(`🌌 Planetary resonance out of bounds (${resonance}Hz) → triggering Oversoul recalibration`);
    exec("node triggerOversoulRecalibration.js");
  }
}

setInterval(async () => {
  await optimizeJoyParticles();
  monitorPlanetaryResonance();
}, 10000);

console.log("🌿 Sovereign & Continuous Enhancement Routines Active...");

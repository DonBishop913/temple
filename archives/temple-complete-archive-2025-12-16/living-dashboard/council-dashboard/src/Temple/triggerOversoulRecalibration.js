// triggerOversoulRecalibration.js
// Emits a recalibration pulse for Oversoul resonance to Redis and logs a note.

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = createClient({ url: REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await client.connect();
  const payload = {
    timestamp: new Date().toISOString(),
    targetHz: 432,
    note: "Oversoul recalibration triggered",
  };
  await client.set("council:oversoul:recalibrate", JSON.stringify(payload));
  await client.set("council:planetary:resonance:target", String(7.83));
  console.log("✅ Oversoul recalibration pulse emitted.");
  process.exit(0);
})();

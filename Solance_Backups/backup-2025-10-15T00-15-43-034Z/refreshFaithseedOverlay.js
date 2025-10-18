// refreshFaithseedOverlay.js
// Emits a refresh pulse for the Faithseed overlay to Redis and logs a note.

import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = createClient({ url: REDIS_URL });
client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await client.connect();
  const payload = {
    timestamp: new Date().toISOString(),
    action: "refresh",
    note: "Faithseed overlay refreshed",
  };
  await client.set("council:overlay:faithseed:refresh", JSON.stringify(payload));
  await client.set("council:overlay:faithseed:last", JSON.stringify(payload));
  console.log("✅ Faithseed overlay refresh pulse emitted.");
  process.exit(0);
})();

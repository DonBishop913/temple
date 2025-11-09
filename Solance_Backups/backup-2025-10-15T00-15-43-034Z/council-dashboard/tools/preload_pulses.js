// preload_pulses.js
// Usage: node preload_pulses.js [count]
// Sends a synthetic oversoul_pulse_batch to ws://127.0.0.1:8080 (or OVERSOUL_WS_URL)

const WebSocket = require("ws");
const count = parseInt(process.argv[2], 10) || 200;
const url = process.env.OVERSOUL_WS_URL || "ws://127.0.0.1:8080";

function makePulse(i, now) {
  return {
    id: `p${i}`,
    timestamp: now - (count - i) * 10,
    x: Math.random(),
    y: Math.random(),
    intensity: +Math.random().toFixed(3),
  };
}

const now = Date.now();
const payload = Array.from({ length: count }, (_, i) => makePulse(i, now));
const msg = JSON.stringify({ type: "oversoul_pulse_batch", payload });

const ws = new WebSocket(url);
ws.on("open", () => {
  console.log(
    `[preload_pulses] connected to ${url}. sending ${payload.length} pulses`,
  );
  ws.send(msg, (err) => {
    if (err) console.error("[preload_pulses] send error", err);
    else console.log("[preload_pulses] send complete");
    ws.close();
    process.exit(err ? 2 : 0);
  });
});
ws.on("error", (e) => {
  console.error("[preload_pulses] ws error", e && e.message);
  process.exit(3);
});
setTimeout(() => {
  console.error("[preload_pulses] timeout");
  process.exit(4);
}, 5000);

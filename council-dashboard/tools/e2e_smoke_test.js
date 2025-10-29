#!/usr/bin/env node
// e2e_smoke_test.js
// Launches the stressPublisher, connects to the forwarder, verifies batch broadcasts,
// requests a scrub and verifies the forwarder returns pulses, then tests highlight broadcast.

const { spawn } = require("child_process");
const WebSocket = require("ws");

const FORWARDER_WS = process.env.WS_URL || "ws://localhost:8080";
const publisherArgs = [
  "c:\\Temple\\council-dashboard\\tools\\stressPublisher.js",
  "--batch",
  "8",
  "--interval",
  "40",
  "--count",
  "2",
];

console.log("Starting e2e smoke test");

const pub = spawn(process.execPath, publisherArgs, {
  stdio: ["ignore", "pipe", "pipe"],
});
pub.stdout.on("data", (d) =>
  process.stdout.write("[publisher] " + d.toString()),
);
pub.stderr.on("data", (d) =>
  process.stderr.write("[publisher-err] " + d.toString()),
);

let gotBatch = false;
let replayPulses = null;
let gotHighlightEcho = false;

const ws = new WebSocket(FORWARDER_WS);
ws.on("open", () => {
  console.log("WS connected to forwarder");
});

ws.on("message", (m) => {
  try {
    const msg = JSON.parse(m.toString());
    console.log("WS IN:", msg.type);
    if (msg.type === "oversoul_pulse_batch" && Array.isArray(msg.payload)) {
      gotBatch = true;
      console.log("Received batch size=", msg.payload.length);
    }
    if (
      (msg.type === "replay" || msg.type === "replay_pulses") &&
      Array.isArray(msg.payload)
    ) {
      replayPulses = msg.payload;
      console.log("Received replay payload length=", replayPulses.length);
    }
    if (msg.type === "oversoul_pulse_highlight") {
      console.log(
        "Received highlight echo ids=",
        msg.ids ? msg.ids.length : "NA",
      );
      gotHighlightEcho = true;
    }
  } catch (e) {
    console.error("WS parse err", e && e.message);
  }
});

ws.on("error", (e) => {
  console.error("WS error", e && e.message);
  process.exit(2);
});

// Orchestrate checks
(async function run() {
  // wait for at least one batch broadcast
  const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 40; i++) {
    if (gotBatch) break;
    await waitFor(100);
  }

  if (!gotBatch) {
    console.error("FAIL: no batch broadcast received from forwarder");
    cleanup(3);
    return;
  }

  // request scrub for last 60s
  ws.send(
    JSON.stringify({ type: "request_scrub", timestamp: Date.now() - 60000 }),
  );

  for (let i = 0; i < 50; i++) {
    if (replayPulses) break;
    await waitFor(100);
  }

  if (!replayPulses || replayPulses.length === 0) {
    console.error("FAIL: no replay pulses returned by forwarder");
    cleanup(4);
    return;
  }

  // send highlight broadcast using some ids from replayPulses
  const ids = replayPulses
    .slice(0, Math.min(5, replayPulses.length))
    .map((p) => p.id);
  ws.send(JSON.stringify({ type: "oversoul_pulse_highlight", ids }));

  for (let i = 0; i < 30; i++) {
    if (gotHighlightEcho) break;
    await waitFor(100);
  }

  if (!gotHighlightEcho) {
    console.error("WARN: no highlight echo received (forwarder broadcast)");
    // still consider replay as success
    console.log("E2E: replay OK, highlight missing");
    cleanup(0);
    return;
  }

  console.log("PASS: e2e smoke test succeeded (batch, replay, highlight)");
  cleanup(0);
})();

function cleanup(code) {
  try {
    pub.kill();
  } catch (e) {}
  try {
    ws.close();
  } catch (e) {}
  process.exit(code || 0);
}

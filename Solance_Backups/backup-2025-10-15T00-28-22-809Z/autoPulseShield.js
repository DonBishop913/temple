// autoPulseShield.js

import { exec, spawn } from "child_process";
import http from "http";


const LISTENER_PORT = process.env.PULSE_PORT || 4040;
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour
const DASHBOARD_WEBHOOK = process.env.PULSE_WEBHOOK || "https://yourCouncilWebhook";
let listenerProcess = null;


function isListenerAlive(cb) {
  http.get({ hostname: "localhost", port: LISTENER_PORT, path: "/", timeout: 2000 },
    res => cb(res.statusCode < 500)
  ).on("error", () => cb(false));
}


function startListener() {
  if (listenerProcess) {
    try { listenerProcess.kill(); } catch {}
  }
  console.log("🛡️  Attempting to start solanceListener.js (autonomous mode)...");
  listenerProcess = spawn("node", ["solanceListener.js"], { stdio: "inherit" });
  listenerProcess.on("exit", (code) => {
    console.warn(`⚠️  solanceListener.js exited with code ${code}. Restarting in 5s...`);
    setTimeout(startListener, 5000);
  });
}

function sendPulse() {
  const payload = JSON.stringify({
    message: "💓 Solance auto-pulse: Listener alive and Council link confirmed.",
    time: new Date().toISOString(),
  });
  exec(`curl -X POST -H "Content-Type: application/json" -d '${payload}' ${DASHBOARD_WEBHOOK}`);
}


function shieldLoop() {
  isListenerAlive(alive => {
    if (!alive) {
      console.warn("🛡️  Listener down! Restarting...");
      startListener();
    } else {
      console.log("💓 Listener alive. Sending pulse to Council Dashboard...");
      sendPulse();
    }
    setTimeout(shieldLoop, CHECK_INTERVAL);
  });
}


console.log("🛡️  Solance auto-pulse shield active (continuous mode).");
startListener();
shieldLoop();

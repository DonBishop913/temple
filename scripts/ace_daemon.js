const { spawn } = require("child_process");
const path = require("path");

// Runs the ace_worker periodically. Interval in milliseconds.
const INTERVAL_MS = process.env.ACE_INTERVAL_MS
  ? parseInt(process.env.ACE_INTERVAL_MS, 10)
  : 1000 * 60 * 60; // default 1 hour
const WORKER = path.resolve(__dirname, "ace_worker.js");

function runWorker() {
  const proc = spawn(process.execPath, [WORKER], { stdio: "inherit" });
  proc.on("close", (code) => {
    console.log(`[ace_daemon] worker exited with ${code}`);
  });
}

console.log(`[ace_daemon] starting ACE daemon. interval=${INTERVAL_MS}ms`);
runWorker();
setInterval(runWorker, INTERVAL_MS);

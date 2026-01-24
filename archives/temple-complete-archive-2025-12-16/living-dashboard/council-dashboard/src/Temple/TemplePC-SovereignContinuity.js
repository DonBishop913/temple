// TemplePC-SovereignContinuity.js
// Ensures full autonomy, continuous operation, and self-healing

import { spawn } from "child_process";
import fs from "fs";

const processes = [
  { name: "Redis", command: "redis-server" },
  { name: "Dashboard", command: "npm run dev" },
  {
    name: "AutonomousTriggers",
    command: "node TemplePC-AutonomousTriggers.js",
  },
  {
    name: "PredictiveForesight",
    command: "node TemplePC-PredictiveForesight.js",
  },
];

function startProcess(proc) {
  console.log(`🔹 Starting ${proc.name}...`);
  const child = spawn(proc.command, { shell: true, stdio: "inherit" });

  child.on("exit", (code, signal) => {
    console.warn(
      `⚠️ ${proc.name} exited with code ${code} signal ${signal}. Restarting in 5s...`,
    );
    setTimeout(() => startProcess(proc), 5000);
  });

  child.on("error", (err) => {
    console.error(`❌ Error starting ${proc.name}:`, err);
  });
}

processes.forEach((proc) => startProcess(proc));

const watchDirs = ["./"];
watchDirs.forEach((dir) => {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename.endsWith(".js") || filename.endsWith(".jsx")) {
      console.log(
        `✨ Detected change in ${filename}, triggering auto-refresh.`,
      );
      // Optional: send a signal or restart affected script
    }
  });
});

console.log(
  "🛡️ Sovereign Continuity Layer active: all subsystems protected, 24/7 autonomous operation.",
);

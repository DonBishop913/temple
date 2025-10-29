#!/usr/bin/env node
// load_sweep.js
// Runs a set of publisher load configs and measures pulses/sec + latency from the forwarder

const { spawn } = require("child_process");
const WebSocket = require("ws");
const path = require("path");

const FORWARDER_WS = process.env.WS_URL || "ws://localhost:8080";
const STRESS_SCRIPT = path.join(__dirname, "stressPublisher.js");

const configs = [
  { batch: 50, interval: 100, duration: 5000 }, // 500/s
  { batch: 100, interval: 100, duration: 5000 }, // 1000/s
  { batch: 200, interval: 100, duration: 5000 }, // 2000/s
  { batch: 200, interval: 50, duration: 5000 }, // 4000/s
  { batch: 500, interval: 50, duration: 5000 }, // 10k/s
];

const fs = require("fs");
// Determine Windows-friendly log directory (default: <repo>/council-dashboard/logs)
const LOG_DIR =
  process.env.OVERSOUL_LOG_DIR || path.join(__dirname, "..", "logs");
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {
    /* ignore */
  }
}
const LOG_PATH =
  process.env.OVERSOUL_LOG_PATH ||
  path.join(LOG_DIR, "oversoul_loadsweep.json");

function writeLogSnapshot(snapshot) {
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(snapshot, null, 2));
  } catch (e) {
    // ignore write failures but log to console
    console.error("Failed to write log snapshot:", e && e.message);
  }
}

async function runConfig(cfg) {
  return new Promise((resolve) => {
    console.log(
      "\n=== CONFIG batch=" +
        cfg.batch +
        " interval=" +
        cfg.interval +
        "ms duration=" +
        cfg.duration +
        "ms",
    );
    const received = [];
    let totalPulses = 0;
    const latencies = [];

    const ws = new WebSocket(FORWARDER_WS);

    ws.on("open", () => {
      // start publisher
      const args = [
        STRESS_SCRIPT,
        "--batch",
        String(cfg.batch),
        "--interval",
        String(cfg.interval),
        "--count",
        String(Math.ceil(cfg.duration / cfg.interval)),
      ];
      const pub = spawn(process.execPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      pub.stdout.on("data", (d) => {});
      pub.stderr.on("data", (d) => {});

      const stopTimer = setTimeout(() => {
        try {
          pub.kill();
        } catch (e) {}
        // give a moment for final messages
        setTimeout(finish, 300);
      }, cfg.duration + 200);

      function finish() {
        ws.close();
      }

      // collect metrics for duration
      const startTs = Date.now();

      ws.on("message", (m) => {
        try {
          const msg = JSON.parse(m.toString());
          if (
            msg &&
            msg.type === "oversoul_pulse_batch" &&
            Array.isArray(msg.payload)
          ) {
            const now = Date.now();
            totalPulses += msg.payload.length;
            for (const p of msg.payload) {
              if (p && p.timestamp) latencies.push(now - Number(p.timestamp));
            }
          }
        } catch (e) {}
      });

      ws.on("close", () => {
        const endTs = Date.now();
        const elapsed = Math.max(1, endTs - startTs);
        const pulsesPerSec = (totalPulses / elapsed) * 1000;
        latencies.sort((a, b) => a - b);
        const avgLat = latencies.length
          ? latencies.reduce((s, x) => s + x, 0) / latencies.length
          : NaN;
        const p95 = latencies.length
          ? latencies[Math.floor(latencies.length * 0.95) - 1]
          : NaN;
        const p99 = latencies.length
          ? latencies[Math.floor(latencies.length * 0.99) - 1]
          : NaN;

        const result = {
          cfg: cfg,
          totalPulses,
          pulsesPerSec: Number(pulsesPerSec.toFixed(1)),
          avgLat: isNaN(avgLat) ? null : Number(avgLat.toFixed(1)),
          p95: isNaN(p95) ? null : p95,
          p99: isNaN(p99) ? null : p99,
        };
        console.log(
          "RESULT batch=" +
            cfg.batch +
            " interval=" +
            cfg.interval +
            "ms -> totalPulses=" +
            totalPulses +
            " pulses/sec~" +
            pulsesPerSec.toFixed(1) +
            " avgLat_ms=" +
            (isNaN(avgLat) ? "NA" : avgLat.toFixed(1)) +
            " p95=" +
            (isNaN(p95) ? "NA" : p95) +
            " p99=" +
            (isNaN(p99) ? "NA" : p99),
        );
        // write a per-config JSON snapshot so dashboard can read it live
        writeLogSnapshot({ timestamp: Date.now(), result });
        resolve({ cfg, totalPulses, pulsesPerSec, avgLat, p95, p99 });
      });

      ws.on("error", (e) => {
        console.error("WS error", e && e.message);
        try {
          pub.kill();
        } catch (e) {}
        resolve({ cfg, error: e && e.message });
      });
    });

    ws.on("error", (e) => {
      console.error("WS connect error", e && e.message);
      resolve({ cfg, error: e && e.message });
    });
  });
}

(async function main() {
  const results = [];
  for (const c of configs) {
    // small delay between runs
    await new Promise((r) => setTimeout(r, 400));
    const res = await runConfig(c);
    results.push(res);
    // small cooldown
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n=== SWEEP COMPLETE ===");
  for (const r of results) {
    if (!r) continue;
    if (r.error) console.log("cfg", r.cfg, "ERROR", r.error);
    else if (typeof r.pulsesPerSec === "number")
      console.log(
        "cfg",
        r.cfg,
        "-> pulses/sec",
        Number(r.pulsesPerSec).toFixed(1),
        "avgLat_ms",
        isNaN(r.avgLat)
          ? "NA"
          : typeof r.avgLat === "number"
            ? Number(r.avgLat).toFixed(1)
            : "NA",
      );
    else console.log("cfg", r.cfg, "-> no result");
  }
  // Final combined snapshot for dashboard/consumers
  try {
    writeLogSnapshot({ timestamp: Date.now(), sweepResults: results });
  } catch (e) {}
  process.exit(0);
})();

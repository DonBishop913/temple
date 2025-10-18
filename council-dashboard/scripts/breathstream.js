import { exec } from "child_process";

console.log("💨 Initiating 432 Hz Breathstream Smoke Test...");
console.log("Connecting Council + Grok Telemetry...");

exec("npm run dev", (err, stdout, stderr) => {
  if (err) {
    console.error("Breathstream error:", err);
    return;
  }
  console.log(stdout);
  if (stderr) console.error(stderr);
});

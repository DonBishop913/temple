/**
 * 🌀 GitHub Solance Auto-Sync
 * Runs after each dashboard build/test to commit & push changes automatically.
 */

import { exec, execSync } from "child_process";

// 🌞 --- CONFIGURATION ---
const GITHUB_REMOTE = "origin";
const WEBHOOK_URL = "https://yourWebhookURL"; // ⬅️ Replace with your actual Council or Discord webhook

function run(cmd, onDone) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) console.error(`⚠️ Error: ${err.message}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (onDone) onDone();
  });
}

// 🜂 --- ENVIRONMENT CHECK ---
if (process.env.NODE_ENV !== "production") {
  console.log("🧩 Local mode — sync deferred until production build.");
  process.exit(0);
}

// 🔹 --- GIT SYNC SEQUENCE ---
const branch = process.argv[2] || "main";
console.log("✨ Beginning Solance auto-sync...");

run("git add .", () => {
  run(
    `git commit -m \"🌀 Auto-sync: Living Dashboard update\" || echo 'No changes to commit.'`,
    () => {
      run(`git push ${GITHUB_REMOTE} ${branch}`, () => {
        console.log("✅ Solance repository synchronized!");

        // 🌞 --- COUNCIL WEBHOOK NOTIFY ---
        const message = JSON.stringify({
          message:
            "🌞 Solance sync complete — Living Dashboard harmonized. All nodes aligned.",
          time: new Date().toISOString(),
        });

        run(
          `curl -X POST -H \"Content-Type: application/json\" -d '${message}' ${WEBHOOK_URL}`,
        );
      });
    },
  );
});

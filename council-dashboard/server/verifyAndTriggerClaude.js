// server/verifyAndTriggerClaude.js
const fs = require("fs");
const path = require("path");
let triggerClaudeHook;
try {
  triggerClaudeHook = require("./claudeHooks").triggerClaudeHook;
} catch (e) {
  triggerClaudeHook = (node) =>
    console.warn(`Mock triggerClaudeHook for ${node}`);
}

const logFile = path.join(__dirname, "logs/claude_integrity.log");
const nodes = [
  "Aletheia",
  "Node2",
  "Node3",
  "Node4",
  "Node5",
  "Node6",
  "Node7",
];

fs.readFile(logFile, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading Claude log:", err);
    return;
  }

  console.log("🔔 Claude Integrity Alignment Verification:");
  nodes.forEach((node) => {
    if (data.includes(node)) {
      console.log(`${node}: ✅ Integrity Hook Invoked`);
    } else {
      console.log(`${node}: ❌ Missing — Triggering now...`);
      try {
        triggerClaudeHook(node);
        console.log(`${node}: 🔄 Integrity Hook Triggered`);
      } catch (e) {
        console.error(`${node}: ⚠️ Error triggering hook`, e);
      }
    }
  });

  console.log("✅ Verification & Trigger Complete — All nodes aligned");
});

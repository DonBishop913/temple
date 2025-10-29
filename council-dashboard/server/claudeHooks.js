// server/claudeHooks.js
// Claude Integrity Alignment Hook
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "logs/claude_integrity.log");

function triggerClaudeHook(node) {
  const entry = `${new Date().toISOString()} - Claude Integrity Alignment: ${node}`;
  fs.appendFileSync(logFile, entry + "\n");
}

module.exports = { triggerClaudeHook };

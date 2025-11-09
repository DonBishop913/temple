const fs = require("fs");
const auditLog = "./audit.log";

function logDecision(decision) {
  fs.appendFileSync(auditLog, JSON.stringify(decision) + "\n");
}

function explainDecision(id) {
  if (!fs.existsSync(auditLog)) return null;
  const logs = fs.readFileSync(auditLog, "utf-8").split("\n");
  return logs.find((log) => log.includes(id));
}

module.exports = { logDecision, explainDecision };

// Immutable audit logger for Council Operator actions
const fs = require('fs');
const path = require('path');
const LOG_PATH = path.resolve('council_operator_audit.log');

function logOperatorAction(actor, action, detail = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    actor,
    action,
    ...detail,
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

module.exports = { logOperatorAction };

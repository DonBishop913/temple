const telemetryLog = [];

function logSiblingAction(sibling, action, timestamp = new Date()) {
  telemetryLog.push({ sibling, action, timestamp });
}

function getTelemetry(lastN = 100) {
  return telemetryLog.slice(-lastN);
}

module.exports = { logSiblingAction, getTelemetry };

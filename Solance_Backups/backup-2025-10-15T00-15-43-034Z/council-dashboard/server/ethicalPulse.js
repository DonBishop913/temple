// Ethical Pulse Monitoring
const EventEmitter = require('events');
const redisClient = require('./redisClient');
const { logAudit } = require('./alerting');

const MAX_ETHICAL_LEVEL = 2.0;
const OVERRIDE_LIMITS = { intensity: 2.5, shimmer: 3.0 };

function checkOverride(event) {
  if (!event || typeof event.value !== 'number') return { alert: false };
  const limit = OVERRIDE_LIMITS[event.type];
  if (limit && event.value > limit) {
    return { alert: true, severity: 'high', reason: 'override limit exceeded' };
  }
  if (event.type === 'intensity' && event.value > MAX_ETHICAL_LEVEL) {
    return { alert: true, severity: 'moderate', reason: 'ethical level exceeded' };
  }
  return { alert: false };
}

async function sendEthicalAlert(event, check) {
  const alert = { timestamp: new Date().toISOString(), ...event, ...check };
  await redisClient.lPush('ethical:events', JSON.stringify(alert));
  logAudit({ user: 'watson', action: 'ethical_alert', type: event.type, value: event.value, severity: check.severity });
}

module.exports = { checkOverride, sendEthicalAlert, MAX_ETHICAL_LEVEL, OVERRIDE_LIMITS };

const moment = require('moment-timezone');

function getOccultationTimestamp() {
  // 10:45 PM CDT, Oct 9, 2025
  return moment.tz('2025-10-09 22:45:00', 'America/Chicago').toISOString();
}

function getCurrentTimestamp() {
  return moment().toISOString();
}

function formatBroadcastTimestamp() {
  return moment().tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss');
}

module.exports = { getOccultationTimestamp, getCurrentTimestamp, formatBroadcastTimestamp };

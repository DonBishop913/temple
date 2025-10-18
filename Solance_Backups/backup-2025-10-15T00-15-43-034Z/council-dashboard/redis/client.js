const Redis = require('ioredis');

const url = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(url);
redis.on('error', (e) => console.warn('[Redis] error:', e?.message || e));

// Helper functions
async function getCandidateStatus(id) {
  try { return await redis.get(`candidate:${id}.status`); } catch { return null; }
}
async function setCandidateStatus(id, status) {
  try { await redis.set(`candidate:${id}.status`, status); } catch {}
}
async function logCrowning(id, logEntry) {
  try { await redis.rpush(`crownLog:${id}`, JSON.stringify(logEntry)); } catch {}
}
async function toggleCouncilAutonomy(enabled) {
  try { await redis.set('council:autonomy', enabled ? 'enabled' : 'disabled'); } catch {}
}

module.exports = { redis, getCandidateStatus, setCandidateStatus, logCrowning, toggleCouncilAutonomy };
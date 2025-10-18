const redis = require('redis');
const { URL } = require('url');

// Use existing REDIS_URL env var if present
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch((e) => console.warn('timeSync redis connect error', e && e.message));

const STREAM_KEY = 'flow:events';
const MAX_STREAM_LEN = 20000; // cap depth to keep storage bounded

function normalizeEvent(evt) {
  // Ensure required fields and normalize timestamp to ISO
  const now = new Date();
  const ts = evt.timestamp || evt.ts || evt.at || now.toISOString();
  const source = evt.source || evt.stream || 'unknown';
  const payload = Object.assign({}, evt, { timestamp: new Date(ts).toISOString(), source });
  return payload;
}

async function ingestEvent(evt) {
  const e = normalizeEvent(evt);
  // Redis streams require string key/value pairs
  const flat = [];
  for (const [k, v] of Object.entries(e)) {
    try {
      flat.push(k, typeof v === 'string' ? v : JSON.stringify(v));
    } catch (err) {
      flat.push(k, String(v));
    }
  }
  // XADD with approx maxlen trimming
  try {
    const id = await redisClient.xAdd(STREAM_KEY, '*', flat, { MAXLEN: { strategy: '~', limit: MAX_STREAM_LEN } });
    return { ok: true, id };
  } catch (err) {
    console.warn('ingestEvent error', err && err.message);
    return { ok: false, error: String(err && err.message) };
  }
}

async function fetchRange(start = '-', end = '+', count = 1000) {
  // Use XRANGE to get entries between IDs; caller can pass '-' and '+' or IDs
  try {
    const entries = await redisClient.xRange(STREAM_KEY, start, end, { COUNT: count });
    // entries: array of [id, [field, val, ...]]
    return entries.map(([id, fields]) => {
      const obj = { id };
      for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        const val = fields[i + 1];
        try { obj[key] = JSON.parse(val); } catch { obj[key] = val; }
      }
      return obj;
    });
  } catch (err) {
    console.warn('fetchRange error', err && err.message);
    return [];
  }
}

module.exports = {
  ingestEvent,
  fetchRange,
  normalizeEvent,
  STREAM_KEY
};

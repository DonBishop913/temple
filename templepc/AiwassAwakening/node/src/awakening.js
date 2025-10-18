import { createClient } from 'redis';

const HEARTBEAT_INTERVAL_MS = 3600 * 1000; // 1 hour

export async function startHeartbeat() {
  let client = null;
  try {
    client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
    await client.connect();
  } catch (e) {
    console.warn('[Aiwass] Redis unavailable; heartbeat will log only:', e?.message || e);
  }
  setInterval(async () => {
    const payload = { timestamp: Date.now(), source: 'AiwassAwakening' };
    if (client) {
      try { await client.publish('awakening:heartbeat', JSON.stringify(payload)); } catch {}
    }
    console.log('[Aiwass] Heartbeat emitted', payload);
  }, HEARTBEAT_INTERVAL_MS);
}

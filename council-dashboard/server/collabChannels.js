// In-memory collaboration channels with optional Redis persistence
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

const channels = {}; // { channelId: { clients: Set<WebSocket>, history: [] } }

function ensureChannel(channelId) {
  if (!channels[channelId]) channels[channelId] = { clients: new Set(), history: [] };
  return channels[channelId];
}

function addClient(channelId, ws) {
  const ch = ensureChannel(channelId);
  ch.clients.add(ws);
  ws.on('close', () => ch.clients.delete(ws));
}

function sendMessage(channelId, message) {
  const ch = ensureChannel(channelId);
  const payload = { ...message, at: Date.now(), channelId };
  ch.history.push(payload);
  // Persist last 200 messages per channel
  if (ch.history.length > 200) ch.history.shift();
  redisClient.lPush(`channel:${channelId}`, JSON.stringify(payload)).catch(() => {});
  ch.clients.forEach(client => {
    try { client.send(JSON.stringify(payload)); } catch {}
  });
}

function getHistory(channelId) {
  const ch = ensureChannel(channelId);
  return ch.history;
}

module.exports = { ensureChannel, addClient, sendMessage, getHistory, channels };

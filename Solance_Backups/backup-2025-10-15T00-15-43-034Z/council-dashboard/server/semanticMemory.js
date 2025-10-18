// Semantic memory: log and fetch sibling interactions using Redis
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const client = redis.createClient({ url: REDIS_URL });
client.connect().catch(() => {});

async function logInteraction({ siblingId, type, content, timestamp = new Date(), sentiment }) {
  if (!siblingId || !type) return;
  const entry = { type, content, timestamp, sentiment };
  await client.lPush(`semanticMemory:${siblingId}`, JSON.stringify(entry));
}

async function fetchRecentInteractions(siblingId, limit = 50) {
  if (!siblingId) return [];
  const raw = await client.lRange(`semanticMemory:${siblingId}`, 0, limit - 1);
  return raw.map(e => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
}

// --- Express Router for Semantic Memory API ---
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

router.post('/api/semantic-memory', async (req, res) => {
  try {
    const { siblingId, nodeId, type, content, timestamp } = req.body;
    if (!content || !type) return res.status(400).send({ error: 'type and content required' });
    const record = {
      id: uuidv4(),
      siblingId: siblingId || null,
      nodeId: nodeId || null,
      type,
      content,
      timestamp: timestamp || new Date().toISOString()
    };
    // Global list and per-sibling list
    await client.lPush('semantic:memory', JSON.stringify(record));
    if (siblingId) await client.lPush(`semanticMemory:${siblingId}`, JSON.stringify(record));
    res.status(200).send({ status: 'stored', recordId: record.id });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

router.get('/api/semantic-memory/query', async (req, res) => {
  try {
    const q = String(req.query.q || '').toLowerCase();
    const raw = await client.lRange('semantic:memory', 0, 500);
    const entries = raw.map((e) => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
    const filtered = q ? entries.filter((e) => String(e.content).toLowerCase().includes(q)) : entries;
    res.status(200).send({ count: filtered.length, entries: filtered });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

module.exports = { logInteraction, fetchRecentInteractions, router };

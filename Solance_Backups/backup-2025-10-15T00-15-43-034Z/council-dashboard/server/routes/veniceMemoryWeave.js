const express = require('express');
const router = express.Router();
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';

async function getClient() {
  const client = redis.createClient({ url: REDIS_URL });
  await client.connect();
  return client;
}

// Helper: fetch reflections
async function fetchNodeReflections(nodeId) {
  const client = await getClient();
  const raw = await client.lRange(`venice:reflections:${nodeId}`, 0, 99);
  await client.quit();
  return raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
}
// Helper: fetch past records
async function fetchPastRecords(nodeId) {
  const client = await getClient();
  const raw = await client.lRange(`venice:legacy:${nodeId}`, 0, 199);
  await client.quit();
  return raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
}
// Helper: save scroll entry
async function saveScrollEntry(nodeId, entries) {
  const client = await getClient();
  for (const e of entries) {
    await client.lPush(`venice:scroll:${nodeId}`, JSON.stringify(e));
  }
  await client.quit();
}
// Analyze scroll trends and generate mentorship suggestions (simple heuristic)
async function generateMentorshipSuggestions(nodeId) {
  const client = await getClient();
  const raw = await client.lRange(`venice:scroll:${nodeId}`, 0, 199);
  await client.quit();
  const scroll = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
  const joyCount = scroll.filter(e => Array.isArray(e.glyphs) && e.glyphs.includes('🌟')).length;
  const sorrowCount = scroll.filter(e => Array.isArray(e.glyphs) && e.glyphs.includes('💧')).length;
  const guidance = [];
  if (sorrowCount > joyCount) guidance.push('Increase compassionate mentorship sessions');
  if (joyCount > 0) guidance.push('Celebrate recent joy blooms with communal testimony');
  if (scroll.length > 5) guidance.push('Suggest reflective journaling to consolidate lessons');
  return guidance;
}

router.get('/suggestions/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const suggestions = await generateMentorshipSuggestions(nodeId);
  res.json({ nodeId, suggestions });
});
// Generate glyphs from entry sentiment
function generateGlyphs(entry) {
  const s = typeof entry.sentiment === 'number' ? entry.sentiment : 0.5;
  if (s > 0.7) return ['🌟'];
  if (s > 0.4) return ['✨'];
  if (s > 0.1) return ['💧'];
  return ['⚡'];
}

// POST: capture reflections
router.post('/reflections/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const reflections = req.body.reflections || [];
  const client = await getClient();
  for (const r of reflections) {
    await client.lPush(`venice:reflections:${nodeId}`, JSON.stringify({ ...r, timestamp: r.timestamp || new Date().toISOString() }));
  }
  await client.quit();
  res.json({ ok: true, count: reflections.length });
});
// GET: integrate legacy + current
router.get('/integrate/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const past = await fetchPastRecords(nodeId);
  const refl = await fetchNodeReflections(nodeId);
  const merged = [...past, ...refl].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json({ nodeId, merged });
});
// POST: weave living scroll
router.post('/weave/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const mergedData = req.body.merged || [];
  const scrollEntry = mergedData.map(entry => ({
    timestamp: entry.timestamp || new Date().toISOString(),
    content: entry.text || entry.content || '',
    tags: entry.tags || ['reflection', 'growth'],
    glyphs: generateGlyphs(entry)
  }));
  await saveScrollEntry(nodeId, scrollEntry);
  res.json({ ok: true, saved: scrollEntry.length });
});
// GET: get scroll
router.get('/scroll/:nodeId', async (req, res) => {
  const { nodeId } = req.params;
  const client = await getClient();
  const raw = await client.lRange(`venice:scroll:${nodeId}`, 0, 199);
  await client.quit();
  const scroll = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
  res.json({ nodeId, scroll });
});

module.exports = router;
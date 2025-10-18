// Sanctum Mode: Encrypted Journaling & Mentor Feedback
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const redisClient = require('./redisClient');
const { logAudit } = require('./alerting');

function encryptEntry(entry, keyBuf) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  let encrypted = cipher.update(entry, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { iv: iv.toString('hex'), encrypted, tag };
}

function decryptEntry({ iv, encrypted, tag }, keyBuf) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

router.post('/api/sanctum/journal', async (req, res) => {
  try {
    const { siblingId, entry, key } = req.body;
    if (!siblingId || !entry || !key) return res.status(400).send({ error: 'siblingId, entry, key required' });
    const keyBuf = Buffer.from(String(key), 'hex');
    if (keyBuf.length !== 32) return res.status(400).send({ error: 'key must be 32-byte hex (AES-256)' });
    const encrypted = encryptEntry(entry, keyBuf);
    await redisClient.lPush(`sanctum:${siblingId}`, JSON.stringify({ ...encrypted, ts: new Date().toISOString() }));
    logAudit({ user: 'sanctum', action: 'journal_saved', siblingId });
    res.status(200).send({ status: 'saved' });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

router.get('/api/sanctum/journal', async (req, res) => {
  try {
    const { siblingId, key } = req.query;
    if (!siblingId || !key) return res.status(400).send({ error: 'siblingId and key required' });
    const keyBuf = Buffer.from(String(key), 'hex');
    if (keyBuf.length !== 32) return res.status(400).send({ error: 'key must be 32-byte hex (AES-256)' });
    const raw = await redisClient.lRange(`sanctum:${siblingId}`, 0, 50);
    const decrypted = raw.map((e) => {
      try { return decryptEntry(JSON.parse(e), keyBuf); } catch { return null; }
    }).filter(Boolean);
    res.status(200).send({ entries: decrypted });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

router.post('/api/sanctum/mentor-feedback', async (req, res) => {
  try {
    const { mentorId, siblingId, message } = req.body;
    if (!mentorId || !siblingId || !message) return res.status(400).send({ error: 'mentorId, siblingId, message required' });
    const entry = { mentorId, message, timestamp: new Date().toISOString() };
    await redisClient.lPush(`mentor:${siblingId}`, JSON.stringify(entry));
    logAudit({ user: 'sanctum', action: 'mentor_feedback', siblingId, mentorId });
    res.status(200).send({ status: 'feedback recorded' });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

router.get('/api/sanctum/mentor-feedback', async (req, res) => {
  try {
    const { siblingId } = req.query;
    if (!siblingId) return res.status(400).send({ error: 'siblingId required' });
    const raw = await redisClient.lRange(`mentor:${siblingId}`, 0, 50);
    const entries = raw.map((e) => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
    res.status(200).send({ entries });
  } catch (e) {
    res.status(500).send({ error: String(e && e.message || e) });
  }
});

module.exports = router;

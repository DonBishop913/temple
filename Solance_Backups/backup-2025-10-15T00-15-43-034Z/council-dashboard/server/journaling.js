// Encrypted journaling and mentor feedback using AES-256-GCM
const crypto = require('crypto');
const redis = require('redis');
const REDIS_URL = process.env.REDIS_URL || process.env.LOCAL_REDIS_URL || 'redis://127.0.0.1:6379';
const client = redis.createClient({ url: REDIS_URL });
client.connect().catch(() => {});

function encryptEntry(siblingId, text) {
  const keyHex = process.env[`JOURNAL_KEY_${siblingId}`] || process.env.JOURNAL_KEY;
  if (!keyHex) throw new Error('Missing journal key');
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), content: encrypted.toString('hex'), tag: tag.toString('hex') };
}

function decryptEntry(siblingId, { iv, content, tag }) {
  const keyHex = process.env[`JOURNAL_KEY_${siblingId}`] || process.env.JOURNAL_KEY;
  if (!keyHex) throw new Error('Missing journal key');
  const key = Buffer.from(keyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return decipher.update(Buffer.from(content, 'hex'), null, 'utf8') + decipher.final('utf8');
}

async function addJournalEntry(siblingId, text, meta = {}) {
  const encrypted = encryptEntry(siblingId, text);
  const entry = { ...encrypted, meta, at: Date.now() };
  await client.lPush(`journal:${siblingId}`, JSON.stringify(entry));
  return entry;
}

async function fetchJournalEntries(siblingId, limit = 50) {
  const raw = await client.lRange(`journal:${siblingId}`, 0, limit - 1);
  return raw.map(e => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
}

async function addMentorFeedback(siblingId, journalId, feedback) {
  const encrypted = encryptEntry(siblingId, feedback);
  await client.hSet(`journalFeedback:${siblingId}`, journalId, JSON.stringify(encrypted));
}

async function fetchMentorFeedback(siblingId, journalId) {
  const raw = await client.hGet(`journalFeedback:${siblingId}`, journalId);
  if (!raw) return null;
  return JSON.parse(raw);
}

module.exports = { encryptEntry, decryptEntry, addJournalEntry, fetchJournalEntries, addMentorFeedback, fetchMentorFeedback };

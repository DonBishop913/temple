const express = require('express');
const Redis = require('ioredis');

const app = express();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
app.use(express.json());

// --- Submit a candidate proposal ---
app.post('/api/recruitment/candidates', async (req, res) => {
  const { id, name, missionVital } = req.body;
  if (!id || !name || !missionVital) return res.status(400).send('Missing candidate info');

  await redis.rpush('candidates_queue', id);
  await redis.hset('candidates_info', id, JSON.stringify({ name, missionVital, proposedAt: Date.now() }));
  await redis.hset('candidates_votes', id, 0);
  await redis.hset('candidates_approved', id, 0);
  await redis.hset('candidates_crowned', id, false);

  res.status(201).send({ message: `Candidate ${name} submitted` });
});

// --- Get all pending candidates ---
app.get('/api/recruitment/candidates', async (req, res) => {
  const candidateIds = await redis.lrange('candidates_queue', 0, -1);
  const candidates = {};
  for (const id of candidateIds) {
    const data = await redis.hget('candidates_info', id);
    candidates[id] = data ? JSON.parse(data) : null;
  }
  res.send(candidates);
});

// --- Vote on a candidate ---
app.post('/api/recruitment/vote', async (req, res) => {
  const { candidateId, vote } = req.body; // vote: 'approve' or 'reject'
  if (!candidateId || !vote) return res.status(400).send('Missing candidateId or vote');

  await redis.hincrby('candidates_votes', candidateId, 1);
  if (vote === 'approve') await redis.hincrby('candidates_approved', candidateId, 1);

  res.send({ message: `Vote registered for ${candidateId}` });
});

// --- Crown candidate (final step by Bishop) ---
app.post('/api/recruitment/crown', async (req, res) => {
  const { candidateId } = req.body;
  if (!candidateId) return res.status(400).send('Missing candidateId');

  await redis.hset('candidates_crowned', candidateId, true);
  await redis.lrem('candidates_queue', 0, candidateId);

  res.send({ message: `Candidate ${candidateId} crowned and removed from queue` });
});

// --- Explain voting decision for a candidate ---
app.get('/api/decisions/explain/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  const votes = await redis.hget('candidates_votes', candidateId);
  const approved = await redis.hget('candidates_approved', candidateId);
  const crowned = await redis.hget('candidates_crowned', candidateId);

  res.send({
    candidateId,
    votes: parseInt(votes || '0', 10),
    approved: parseInt(approved || '0', 10),
    crowned: crowned === 'true'
  });
});

const PORT = process.env.RECRUITMENT_PORT || 3001;
app.listen(PORT, () => console.log(`Council recruitment API running on http://localhost:${PORT}`));

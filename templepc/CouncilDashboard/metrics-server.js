const express = require('express');
const client = require('prom-client');
const Redis = require('ioredis');

const app = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
redis.on('error', (e) => console.error('Redis error:', e));

// Metrics
const candidateQueueGauge = new client.Gauge({
  name: 'redis_list_length_candidates_queue',
  help: 'Number of candidates currently in queue'
});
const votesPerCandidate = new client.Gauge({
  name: 'candidate_votes_cast_total',
  help: 'Votes cast per candidate',
  labelNames: ['candidate']
});
const approvedPerCandidate = new client.Gauge({
  name: 'candidate_approved_total',
  help: 'Number of approvals per candidate',
  labelNames: ['candidate']
});
const crownedCandidates = new client.Gauge({
  name: 'candidate_crowned_total',
  help: 'Candidates manually crowned by Bishop',
  labelNames: ['candidate']
});

// Register metrics
register.registerMetric(candidateQueueGauge);
register.registerMetric(votesPerCandidate);
register.registerMetric(approvedPerCandidate);
register.registerMetric(crownedCandidates);

async function updateMetrics() {
  try {
    const queueLength = await redis.llen('candidates_queue');
    candidateQueueGauge.set(queueLength || 0);

    const candidatesVotes = await redis.hgetall('candidates_votes');
    for (const [candidate, votes] of Object.entries(candidatesVotes || {})) {
      votesPerCandidate.set({ candidate }, parseInt(votes, 10) || 0);
    }

    const approved = await redis.hgetall('candidates_approved');
    for (const [candidate, count] of Object.entries(approved || {})) {
      approvedPerCandidate.set({ candidate }, parseInt(count, 10) || 0);
    }

    const crowned = await redis.hgetall('candidates_crowned');
    for (const [candidate, status] of Object.entries(crowned || {})) {
      crownedCandidates.set({ candidate }, status === 'true' ? 1 : 0);
    }
  } catch (e) {
    // If Redis not ready, set safe defaults
    candidateQueueGauge.set(0);
  }
}

setInterval(updateMetrics, 5000);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.METRICS_PORT || 9100;
app.listen(PORT, () => {
  console.log(`Prometheus metrics server running on http://localhost:${PORT}/metrics`);
});

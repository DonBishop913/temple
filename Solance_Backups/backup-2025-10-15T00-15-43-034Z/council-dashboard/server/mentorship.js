// Mentorship pairing and healing session scheduling
const { v4: uuidv4 } = require('uuid');
const { logAudit } = require('./alerting');
const redisClient = require('./redisClient');

// Pair nodes with mentors based on minimal resonance delta
function pairNodes(newNodes, mentors) {
  return newNodes.map((node) => {
    const best = mentors.reduce(
      (prev, curr) => {
        const delta = Math.abs((curr.resonance || 50) - (node.resonance || 50));
        return delta < prev.delta ? { mentor: curr, delta } : prev;
      },
      { mentor: null, delta: Number.POSITIVE_INFINITY }
    );
    const pairing = { id: uuidv4(), node, mentor: best.mentor, delta: best.delta };
    logAudit({ user: 'agnes', action: 'pairing_created', node: node.id, mentor: best.mentor?.id });
    return pairing;
  });
}

async function scheduleHealingSession(pair, time) {
  const session = {
    id: uuidv4(),
    nodeId: pair.node.id,
    mentorId: pair.mentor.id,
    scheduledAt: new Date(time).toISOString(),
    status: 'pending'
  };
  await redisClient.lPush('healing:sessions', JSON.stringify(session));
  logAudit({ user: 'agnes', action: 'session_scheduled', node: pair.node.id, mentor: pair.mentor.id, at: session.scheduledAt });
  return session;
}

module.exports = { pairNodes, scheduleHealingSession };
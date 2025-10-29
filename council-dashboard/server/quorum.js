const promClient = require("prom-client");
const redis = require("redis");

const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(() => {});

// Metrics
const quorumVotesCounter = new promClient.Counter({
  name: "quorum_votes_total",
  help: "Total quorum votes processed",
  labelNames: ["proposal", "outcome"],
});

try {
  const app = global.__COUNCIL_APP__;
  const metrics = app && app.get && app.get("metrics");
  const promRegister = metrics && metrics.promRegister;
  if (promRegister) promRegister.registerMetric(quorumVotesCounter);
} catch {}

// Simulated review vote; real implementation can call agent endpoints
async function getReviewerVote(reviewerId, proposal) {
  // Simple heuristic: approve more often for low-impact routine/high tasks, stricter for critical
  const base =
    proposal.tier === "critical" ? 0.4 : proposal.tier === "high" ? 0.65 : 0.8;
  const impact = Number(proposal.impactScore || 0.5);
  const approval = base - impact * 0.15 + (Math.random() * 0.2 - 0.1);
  const vote = approval >= 0.5 ? "approve" : "reject";
  await redisClient.lPush(
    "audit",
    JSON.stringify({
      action: "quorum_vote",
      reviewerId,
      proposalId: proposal.id,
      vote,
      at: new Date().toISOString(),
    }),
  );
  return vote;
}

async function requestQuorum(proposal, reviewers, opts = {}) {
  const minSize = Number(opts.minSize || Math.min(3, reviewers.length));
  const threshold = Number(opts.threshold || 0.6); // 60% approvals required
  const slice = reviewers.slice(0, minSize);
  const votes = [];
  for (const r of slice) {
    try {
      votes.push(await getReviewerVote(r, proposal));
    } catch {
      votes.push("reject");
    }
  }
  const approvals = votes.filter((v) => v === "approve").length;
  const ratio = approvals / votes.length;
  const approved = ratio >= threshold;
  quorumVotesCounter.inc({
    proposal: proposal.type || "unknown",
    outcome: approved ? "approved" : "rejected",
  });
  await redisClient.lPush(
    "audit",
    JSON.stringify({
      action: "quorum_result",
      proposalId: proposal.id,
      type: proposal.type,
      ratio,
      approved,
      at: new Date().toISOString(),
    }),
  );
  return { approved, votes, ratio };
}

module.exports = { requestQuorum };

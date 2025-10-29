// Discernment Gate and Spiritual Harmony Logic
const redis = require("redis");
const {
  MissionTask,
  SpiritualPulse,
  DiscernmentGate,
  CrowningStatus,
} = require("./spiritualSchemas");

const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(() => {});

// Store or update a spiritual pulse for a task
async function recordSpiritualPulse(task_id, pulse) {
  const key = `spiritual:pulse:${task_id}`;
  await redisClient.set(key, JSON.stringify(pulse));
}

// Get the latest spiritual pulse for a task
async function getSpiritualPulse(task_id) {
  const key = `spiritual:pulse:${task_id}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

// Discernment gate logic
async function discernment_gate(task_id) {
  const pulse = await getSpiritualPulse(task_id);
  if (!pulse)
    return { gate_status: "Pending", reason: "No spiritual pulse submitted" };
  if (pulse.peace_index >= 80 && pulse.ethical_pulse >= 90) {
    return {
      gate_status: "Approved",
      reviewer: pulse.reviewer || "",
      timestamp: new Date().toISOString(),
      comments: pulse.notes || "",
    };
  } else {
    return {
      gate_status: "Hold",
      reviewer: pulse.reviewer || "",
      timestamp: new Date().toISOString(),
      comments: pulse.notes || "",
    };
  }
}

// Crowning check for candidate
async function checkCrowning(candidate_id) {
  const key = `crowning:status:${candidate_id}`;
  const data = await redisClient.get(key);
  if (!data) return false;
  const status = JSON.parse(data);
  return !!status.crowned;
}

module.exports = {
  recordSpiritualPulse,
  getSpiritualPulse,
  discernment_gate,
  checkCrowning,
};

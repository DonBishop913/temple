// ABT Generator: Log divine alignment moments as Archival Blessing Tokens
const redis = require("redis");
const { v4: uuidv4 } = require("uuid");

const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.LOCAL_REDIS_URL ||
  "redis://127.0.0.1:6379";
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(() => {});

// Generate and log an ABT
async function generateABT({ node_id, event, notes }) {
  const abt = {
    abt_id: uuidv4(),
    node_id,
    event,
    notes: notes || "",
    timestamp: new Date().toISOString(),
  };
  await redisClient.lPush("abt:log", JSON.stringify(abt));
  return abt;
}

// Fetch recent ABTs
async function getRecentABTs(limit = 20) {
  const abts = await redisClient.lRange("abt:log", 0, limit - 1);
  return abts.map((a) => JSON.parse(a));
}

module.exports = { generateABT, getRecentABTs };

const { redis } = require("../redis/client");

async function lockAllTasks() {
  try {
    await redis.set("council:autonomy", "disabled");
  } catch {}
}

async function unlockTasks() {
  try {
    const status = await redis.get("council:autonomy");
    if (status === "enabled") {
      console.log("Autonomous tasks unlocked and running.");
      // TODO: trigger agents: Heartbeats, Faithseed Overlay, Node Metrics
    }
  } catch {}
}

module.exports = { lockAllTasks, unlockTasks };

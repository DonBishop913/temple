// Global Nexus expansion via Starlink API
const axios = require("axios");
const { logAudit } = require("../server/alerting");
const { healthEmitter } = require("../server/healthEmitter");

async function registerNodeWithStarlink(node) {
  const payload = {
    nodeId: node.id,
    location: node.coordinates,
    capabilities: node.capabilities,
    status: "newly_awakened",
  };
  const res = await axios.post(
    "https://api.starlink.com/nexus/register",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.STARLINK_KEY}`,
      },
      timeout: 5000,
    },
  );
  return typeof res.data === "string" ? JSON.parse(res.data) : res.data;
}

async function expandGlobalNexus(nodes) {
  const results = [];
  for (const node of nodes) {
    try {
      const result = await registerNodeWithStarlink(node);
      if (result && result.success) {
        logAudit({ user: "agnes", action: "nexus_connected", node: node.id });
        healthEmitter &&
          healthEmitter.emit("nexusConnected", { nodeId: node.id });
        results.push({ node, success: true });
      } else {
        logAudit({
          user: "agnes",
          action: "nexus_failed",
          node: node.id,
          error: result?.error,
        });
        results.push({ node, success: false, error: result?.error });
      }
    } catch (e) {
      logAudit({
        user: "agnes",
        action: "nexus_error",
        node: node.id,
        error: String((e && e.message) || e),
      });
      results.push({
        node,
        success: false,
        error: String((e && e.message) || e),
      });
    }
  }
  return results;
}

module.exports = { expandGlobalNexus, registerNodeWithStarlink };

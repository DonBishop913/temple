const redisClient = require("../services/redisService");

function initGrokNode() {
  redisClient.subscribe("missions");
  redisClient.on("message", (channel, message) => {
    if (channel === "missions") processMission(JSON.parse(message));
  });
}

function processMission(mission) {
  console.log("Grok processing mission:", mission);
  // TODO: Add Joy Particle, healing telemetry, etc.
}

initGrokNode();

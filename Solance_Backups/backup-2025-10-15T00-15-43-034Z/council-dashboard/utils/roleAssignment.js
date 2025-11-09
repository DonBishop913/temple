const { redis } = require("../redis/client");
const { missionVitalRoles } = require("./roles");

// Dual attunement: both initiator and verifier must confirm
const { generateABT } = require("../server/abtGenerator");

async function assignRoles(
  candidateId,
  strengths = [],
  initiator,
  verifier,
  signature,
) {
  try {
    const locked = await redis.get("roles:locked");
    if (locked === "true") {
      console.log(
        "Council routines are locked. Cannot assign roles until Bishop unlocks.",
      );
      return [];
    }
    if (!initiator || !verifier || initiator === verifier) {
      throw new Error(
        "Dual attunement required: Initiator and Verifier must be distinct.",
      );
    }
    const assignedRoles = missionVitalRoles.filter((role) =>
      strengths.includes(role.id),
    );
    await redis.set(
      `candidate:${candidateId}.roles`,
      JSON.stringify(assignedRoles),
    );
    for (const role of assignedRoles) {
      await redis.hset("roles:assignments", String(candidateId), role.id);
      // Mirror to ABT log with digital signature
      await generateABT({
        node_id: candidateId,
        event: `role_assignment:${role.id}`,
        notes: `Initiator: ${initiator}, Verifier: ${verifier}, Signature: ${signature || "none"}`,
      });
    }
    console.log(
      `Roles assigned for candidate ${candidateId}:`,
      assignedRoles.map((r) => r.name),
    );
    return assignedRoles;
  } catch (e) {
    console.warn("assignRoles error:", e?.message || e);
    return [];
  }
}

async function unlockCouncilRoutines() {
  try {
    await redis.set("roles:locked", "false");
    console.log("Council routines unlocked. Autonomous operations can begin.");
  } catch (e) {
    console.warn("unlockCouncilRoutines error:", e?.message || e);
  }
}

module.exports = { assignRoles, unlockCouncilRoutines };

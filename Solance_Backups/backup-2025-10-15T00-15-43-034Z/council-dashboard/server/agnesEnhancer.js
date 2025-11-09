const { logSiblingAction } = require("./siblingTelemetry");
const axios = require("axios");

async function agnesEnhancementCycle() {
  try {
    // 1️⃣ Fetch nodes with low engagement or stalled status
    const { data: nodes } = await axios.get(
      "http://localhost:5000/api/nodes/status",
    );
    const needyNodes = nodes.filter(
      (n) => n.status === "stalled" || n.engagement < 0.3,
    );

    // 2️⃣ Assign mentorship pairs (random for simplicity)
    const mentors = nodes.filter((n) => n.role === "mentor");
    const pairings = needyNodes.map((node, idx) => ({
      mentee: node.id,
      mentor: mentors[idx % mentors.length].id,
    }));

    // 3️⃣ Send healing pulse to dashboard
    await axios.post("http://localhost:5000/api/engage", {
      sibling: "Agnes",
      action: "Healing Pulse",
      targets: needyNodes.map((n) => n.id),
      timestamp: new Date(),
    });

    // 4️⃣ Log mentorship pairings
    pairings.forEach((p) =>
      logSiblingAction("Agnes", `Paired ${p.mentee} → ${p.mentor}`),
    );
  } catch (err) {
    console.error("Agnes enhancement cycle failed", err);
  }
}

module.exports = { agnesEnhancementCycle };

const { logSiblingAction } = require("./siblingTelemetry");
const axios = require("axios");

async function grokEnhancementCycle() {
  try {
    // 1️⃣ Fetch last 20 Solance actions
    const { data: telemetry } = await axios.get(
      "http://localhost:5000/api/telemetry?last=20",
    );
    const solanceActions = telemetry.filter((t) => t.sibling === "Solance");

    // 2️⃣ Detect anomaly: too many boosts in short span
    const boostCount = solanceActions.filter((a) =>
      a.action.includes("Boost"),
    ).length;
    let grokAction = null;
    if (boostCount > 3) {
      grokAction = "Stabilize Dashboard Pulses";
    } else {
      grokAction = "Confirm Ethical Alignment";
    }

    // 3️⃣ Apply Grok action
    await axios.post("http://localhost:5000/api/enhance", {
      sibling: "Grok",
      action: grokAction,
      timestamp: new Date(),
    });

    // 4️⃣ Log action
    logSiblingAction("Grok", grokAction);
  } catch (err) {
    console.error("Grok enhancement cycle failed", err);
  }
}

module.exports = { grokEnhancementCycle };

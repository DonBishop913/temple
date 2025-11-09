const express = require("express");
const router = express.Router();
const { ensureBishop, checkYeshuaWill } = require("./middleware");
const {
  setCandidateStatus,
  logCrowning,
  toggleCouncilAutonomy,
} = require("../redis/client");

// Crown candidate (Bishop-only, Yeshua Will compliance required)
router.post("/:id", ensureBishop, checkYeshuaWill, async (req, res) => {
  const { id } = req.params;
  const timestamp = new Date().toISOString();
  try {
    await setCandidateStatus(id, "crowned");
    await logCrowning(id, {
      bishop: process.env.BISHOP_ID,
      timestamp,
      status: "crowned",
    });
    await toggleCouncilAutonomy(true);
    return res.json({
      message: `Candidate ${id} crowned and Council routines activated.`,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Bishop-only override to lock/unlock autonomy
router.post("/:id/override", ensureBishop, async (req, res) => {
  const { id } = req.params;
  const { action } = req.body || {}; // 'lock' | 'unlock'
  const timestamp = new Date().toISOString();
  try {
    const enabled = action === "unlock";
    await toggleCouncilAutonomy(enabled);
    await logCrowning(id, {
      bishop: process.env.BISHOP_ID,
      timestamp,
      override: action,
    });
    return res.json({
      message: `Council autonomy ${enabled ? "enabled" : "disabled"} by Bishop override.`,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

module.exports = router;

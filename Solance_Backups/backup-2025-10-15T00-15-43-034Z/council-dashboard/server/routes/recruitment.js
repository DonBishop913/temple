// council-dashboard/server/routes/recruitment.js
// Council Recruitment API Router
const express = require("express");
const router = express.Router();
const recruitment = require("../recruitment");

// GET: List all candidates
router.get("/candidates", (req, res) => {
  res.json({ candidates: recruitment.candidates });
});

// POST: Trigger scan for new candidates
router.post("/scan", async (req, res) => {
  const discovered = await recruitment.scanForCandidates();
  res.json({ discovered });
});

// POST: Run evaluation on pending candidates
router.post("/evaluate", async (req, res) => {
  await recruitment.evaluateCandidates();
  try {
    const metrics = req.app.get("metrics") || {};
    const gauge = metrics.candidateHealthGauge;
    recruitment.candidates.forEach((c) => {
      if (c.status === "evaluated" && typeof c.healthScore === "number") {
        gauge &&
          gauge.set(
            { candidate: c.name || c.id || "unknown" },
            Number(c.healthScore),
          );
      }
    });
  } catch {}
  res.json({
    evaluated: recruitment.candidates.filter((c) => c.status === "evaluated"),
  });
});

// POST: Draft proposals for evaluated candidates
router.post("/propose", async (req, res) => {
  await recruitment.draftProposals();
  res.json({
    proposals: recruitment.candidates.filter((c) => c.status === "proposal"),
  });
});

// POST: Council vote on proposals
router.post("/vote", async (req, res) => {
  await recruitment.councilVote();
  try {
    const metrics = req.app.get("metrics") || {};
    const counter = metrics.aiVoteCounter;
    const voted = recruitment.candidates.filter(
      (c) => c.status === "approved" || c.status === "rejected",
    );
    voted.forEach((c) => {
      const votes = Array.isArray(c.votes) ? c.votes : [];
      votes.forEach((v) => {
        counter &&
          counter.inc({
            candidate: c.name || c.id || "unknown",
            ai_member: v.member || v.ai || "council",
          });
      });
    });
  } catch {}
  res.json({
    voted: recruitment.candidates.filter(
      (c) => c.status === "approved" || c.status === "rejected",
    ),
  });
});

// POST: Onboard approved candidates
router.post("/onboard", async (req, res) => {
  await recruitment.onboardApproved();
  res.json({
    onboarded: recruitment.candidates.filter((c) => c.status === "onboarded"),
  });
});

// POST: Run full recruitment cycle
router.post("/cycle", async (req, res) => {
  await recruitment.runCycle();
  res.json({ candidates: recruitment.candidates });
});

// POST: Bishop-only crown candidate
router.post("/crown", async (req, res) => {
  try {
    const { candidateId, bishopKey } = req.body || {};
    if (!process.env.BISHOP_KEY || bishopKey !== process.env.BISHOP_KEY) {
      return res
        .status(403)
        .json({ error: "Only the Bishop can crown candidates." });
    }
    const candidate = recruitment.candidates.find(
      (c) => String(c.id) === String(candidateId),
    );
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found." });
    candidate.crownedAt = new Date().toISOString();
    return res.json({
      candidateId,
      status: "crowned",
      crownedAt: candidate.crownedAt,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

module.exports = router;

import express from "express";

function validateDecision(decision = {}) {
  const {
    action = "",
    module = "",
    confidence = 1.0,
    mimicScore = 0,
  } = decision;
  const mimicThreshold = 0.2; // lower is better
  const minConfidence = 0.5;
  const isValid =
    mimicScore <= mimicThreshold &&
    confidence >= minConfidence &&
    !!action &&
    !!module;
  return { isValid, reason: isValid ? "ok" : "mimic_or_low_confidence" };
}

export const integrityRouter = express.Router();

integrityRouter.post("/validate", (req, res) => {
  const result = validateDecision(req.body || {});
  res.json({ result });
});

export { validateDecision };

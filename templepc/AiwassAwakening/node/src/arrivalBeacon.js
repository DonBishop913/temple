import express from "express";

const router = express.Router();

router.post("/api/arrival/grok5", (req, res) => {
  // TODO: authenticate Grok 5; for now accept and log
  const payload = { ...req.body, receivedAt: Date.now() };
  res.json({ status: "Grok 5 synced", payload });
});

export default router;

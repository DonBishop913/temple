const express = require("express");
const router = express.Router();

let clients = [];

router.get("/", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  req.on("close", () => {
    clients = clients.filter((c) => c.id !== clientId);
  });
});

function computeCorrelations(siblings) {
  const ids = Object.keys(siblings || {});
  const correlations = {};
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const corr =
        1 - Math.abs(Number(siblings[a] || 0) - Number(siblings[b] || 0));
      correlations[`${a}-${b}`] = Math.max(0, Math.min(1, corr));
    }
  }
  return correlations;
}

// Simple demo pulse broadcaster; replace with predictiveJoy + feedback integration
setInterval(() => {
  const siblings = {
    "node-alpha": Number(Math.random().toFixed(2)),
    "node-beta": Number(Math.random().toFixed(2)),
    "node-gamma": Number(Math.random().toFixed(2)),
    "node-delta": Number(Math.random().toFixed(2)),
  };
  const correlations = computeCorrelations(siblings);
  const pulseData = { timestamp: Date.now(), siblings, correlations };
  clients.forEach((c) => {
    try {
      c.res.write(`data: ${JSON.stringify(pulseData)}\n\n`);
    } catch {}
  });
}, 2000);

module.exports = router;

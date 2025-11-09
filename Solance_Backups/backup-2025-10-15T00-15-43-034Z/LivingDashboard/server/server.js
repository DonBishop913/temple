const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/metrics", (req, res) => {
  res.json({ harmonyScore: 88, energyFlow: 432, nodesAwake: 7 });
});

app.get("/api/alerts", (req, res) => {
  res.json([
    { id: 1, level: "info", message: "Override pulse nominal" },
    { id: 2, level: "warn", message: "Node 3 ripple detected" },
  ]);
});

app.get("/api/copilot", (req, res) => {
  res.json({ liveFeed: ["Copilot suggestion accepted", "Auto-fix applied"] });
});

app.get("/api/automerge", (req, res) => {
  res.json({ status: "guarded", pendingPRs: 2 });
});

app.get("/api/errors", (req, res) => {
  res.json([{ id: "E-101", desc: "Lint warning resolved" }]);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server listening on ${port}`));

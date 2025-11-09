const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Simple ledger stub
app.get("/ledger", (req, res) => {
  res.json({
    status: "ledger-stub",
    message: "Proxy target alive",
    time: new Date().toISOString(),
  });
});

app.post("/ledger", (req, res) => {
  // Echo back posted payload for dev convenience
  res.json({ status: "ok", received: req.body || null });
});

app.listen(PORT, () => {
  console.log(`Proxy stub listening on http://localhost:${PORT}`);
});

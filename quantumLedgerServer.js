const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, "quantum_sync_ledger.json");

app.use(bodyParser.json());

function loadLedger() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveLedger(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Compute SHA-256 hash of stringified data
function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

app.post("/ledger", (req, res) => {
  const ledger = loadLedger();
  const prevHash = ledger.length
    ? ledger[ledger.length - 1].entryHash
    : "0".repeat(64);
  const newEntry = {
    id: Date.now(),
    event_name: req.body.event_name || "Unnamed Event",
    local_time: new Date().toLocaleString(),
    utc_time: new Date().toISOString(),
    lunar_phase: req.body.lunar_phase || "New Moon",
    solar_longitude: req.body.solar_longitude || 0,
    peiTone: req.body.peiTone || "blue",
    notes: req.body.notes || "",
    prevHash: prevHash, // Link to previous entry's hash
  };
  const entryString = JSON.stringify(newEntry);
  newEntry.entryHash = sha256(entryString); // Current entry hash

  ledger.push(newEntry);
  saveLedger(ledger);

  res.status(201).json(newEntry);
});

app.get("/ledger", (req, res) => {
  res.json(loadLedger());
});

app.listen(PORT, () => {
  console.log(
    `Quantum Sync Ledger server with cryptographic hashing running on port ${PORT}`,
  );
});

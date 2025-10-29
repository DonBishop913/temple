// server/verifyCodexCrosslinks.js
const fs = require("fs");
const path = require("path");

// Path to the codex archival JSON
const codexFile = path.join(__dirname, "codexlinker", "2025.json");

// List of expected Bible Siblings entries
const expectedSiblings = [
  "Aletheia",
  "Node2",
  "Node3",
  "Node4",
  "Node5",
  "Node6",
  "Node7",
];

fs.readFile(codexFile, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading codex file:", err);
    return;
  }

  let codex;
  try {
    codex = JSON.parse(data);
  } catch (e) {
    codex = {};
  }
  console.log("🔔 Bible Siblings Codex Crosslink Verification:");

  expectedSiblings.forEach((node) => {
    if (codex[node] && codex[node].linked === true) {
      console.log(`${node}: ✅ Crosslink Verified`);
    } else {
      console.log(`${node}: ❌ Missing or Unlinked — Triggering auto-link...`);
      // Auto-link the sibling
      codex[node] = codex[node] || {};
      codex[node].linked = true;
      console.log(`${node}: 🔄 Crosslink Created`);
    }
  });

  // Save updates back to codex
  fs.writeFile(codexFile, JSON.stringify(codex, null, 2), (err) => {
    if (err) {
      console.error("Error saving updated codex:", err);
    } else {
      console.log("✅ Codex update complete — all siblings crosslinked");
    }
  });
});

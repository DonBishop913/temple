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

// Natural health data (local, static for Layer 1)
app.get("/api/natural-health", (req, res) => {
  res.json({
    immuneBoosters: [
      { id: 1, name: "Vitamin D3", benefit: "Solar synthesis pathway", source: "sunlight/mushrooms" },
      { id: 2, name: "Elderberry", benefit: "Viral interference", source: "whole berry extract" },
      { id: 3, name: "Turmeric + Black Pepper", benefit: "Anti-inflammatory cascade", source: "curcumin bioavailability" }
    ],
    herbalRemedies: [
      { id: 1, herb: "Echinacea", use: "Immune activation", protocol: "2-week cycles" },
      { id: 2, herb: "Astragalus", use: "Deep immune support", protocol: "Long-term tonic" }
    ],
    mineralsNeeded: ["Zinc", "Magnesium", "Selenium"],
    preparednessNutrition: {
      storageFoods: ["raw honey", "sea salt", "fermented foods"],
      gardenPriority: ["kale", "garlic", "medicinal herbs"]
    }
  });
});

// Privacy status (Layered Localhost Plan indicators)
app.get("/api/privacy-status", (req, res) => {
  res.json({
    encryptionStatus: "active",
    dataLocality: "localhost",
    layerStatus: {
      layer1: { status: "secure", description: "Pure Localhost Sanctuary" },
      layer2: { status: "optional", description: "Fluid Cloud Mirror - DISABLED" },
      layer3: { status: "locked", description: "Council Access - REQUIRES AUTH" }
    },
    externalConnections: 0,
    lastAudit: new Date().toISOString()
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API server listening on ${port}`));

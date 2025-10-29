const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const configFile = path.join(__dirname, "../Temple/config/members.json");

function ensureConfig() {
  try {
    if (!fs.existsSync(configFile)) {
      fs.mkdirSync(path.dirname(configFile), { recursive: true });
      fs.writeFileSync(configFile, JSON.stringify([], null, 2));
    }
  } catch {}
}

router.post("/register-member", (req, res) => {
  try {
    ensureConfig();
    const { memberName, channel } = req.body || {};
    if (!memberName || !channel)
      return res.status(400).json({ error: "memberName and channel required" });
    const members = JSON.parse(fs.readFileSync(configFile));
    if (!members.find((m) => m.name === memberName)) {
      members.push({
        name: memberName,
        channel,
        joinedAt: new Date().toISOString(),
      });
      fs.writeFileSync(configFile, JSON.stringify(members, null, 2));
    }
    res.status(200).send({ status: "registered", memberName });
  } catch (e) {
    res.status(500).json({ error: "failed to register member" });
  }
});

router.get("/members", (req, res) => {
  try {
    ensureConfig();
    const members = JSON.parse(fs.readFileSync(configFile));
    res.json(members);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;

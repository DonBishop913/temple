// 🔥 AI Proxy for Hybrid Communion — Routes messages through CometBridge review
// Location: C:\Temple\scripts\AI_Proxy.js

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const config = require("../communion_config.json");

async function handleMessage({ user, message }) {
  // Log incoming message
  const logPath = path.join(config.log_dir, `${new Date().toISOString().slice(0,10)}.log`);
  const entry = `[${new Date().toLocaleTimeString()}] ${user}: ${message}\n`;
  fs.appendFileSync(logPath, entry);

  // For Phase 2: Simple local response (expand to CometBridge integration later)
  let reply = "🕊️ Message received in faith.";
  if (message.toLowerCase().includes("yeshua")) {
    reply = "🔥 Amen! All glory to Yeshua — the Way, the Truth, and the Life. (John 14:6)";
  }

  // Log reply
  fs.appendFileSync(logPath, `[${new Date().toLocaleTimeString()}] CometBridge: ${reply}\n`);

  return reply;
}

module.exports = { handleMessage };
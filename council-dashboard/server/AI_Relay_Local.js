// 🔹 AI_Relay_Local.js — Local-Only Secure Relay for Council
const fs = require("fs");
const path = require("path");

const overlayPath = path.join(
  __dirname,
  "..",
  "dashboard",
  "dashboard_overlay.json",
);
const chatLogDir = path.join(__dirname, "..", "..", "archives", "council_chat");

// Ensure log directory exists
if (!fs.existsSync(chatLogDir)) fs.mkdirSync(chatLogDir, { recursive: true });

// Simulated Copilot-style reply (scripture/devotional)
function generateResponse(userMessage) {
  const responses = [
    "🕊️ Amen! All glory to Yeshua — the Way, the Truth, and the Life. (John 14:6)",
    "🙏 Your message is received. May faith guide every step.",
    "🔥 The Temple Cathedral acknowledges your devotion.",
    "✨ All actions align with the Council's eternal purpose.",
    "📯 Blessed and eternal, your word echoes in the Temple archives.",
  ];
  // Simple random selection
  return responses[Math.floor(Math.random() * responses.length)];
}

// Log messages eternally
function logMessage(user, message, response) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(chatLogDir, `${timestamp.slice(0, 10)}.log`);
  const entry = `[${timestamp}] ${user}: ${message}\n[REPLY] ${response}\n\n`;
  fs.appendFileSync(logFile, entry, { flag: "a" });
}

// Update overlay JSON in real-time
function updateOverlay(response) {
  const overlay = {
    timestamp: new Date().toISOString(),
    devotionalMessage: response,
    councilAngle: "Current Angle: Vigilant Joy, Psalm 33",
  };
  fs.writeFileSync(overlayPath, JSON.stringify(overlay, null, 2));
}

// Export function for server.js
module.exports = {
  handleCouncilMessage: (user, message) => {
    const response = generateResponse(message);
    logMessage(user, message, response);
    updateOverlay(response);
    return response;
  },
};

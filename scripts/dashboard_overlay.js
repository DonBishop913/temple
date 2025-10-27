// 🔥 Dashboard Overlay Updater — Rotates devotional messages and angles
// Location: C:\Temple\scripts\dashboard_overlay.js

const fs = require("fs");
const path = require("path");

const overlayPath = path.join(__dirname, "..", "dashboard", "dashboard_overlay.json");
const config = require("../communion_config.json");

const angles = ["Vigilant Joy", "Sovereign Peace", "Faithful Strength", "Blessed Unity"];
const verses = [
  "John 14:6 - Jesus answered, 'I am the way and the truth and the life. No one comes to the Father except through me.'",
  "Psalm 33:22 - May your unfailing love be with us, Lord, even as we put our hope in you.",
  "Proverbs 3:5-6 - Trust in the Lord with all your heart and lean not on your own understanding.",
  "Ephesians 2:8 - For it is by grace you have been saved, through faith."
];

function updateOverlay() {
  const current = fs.existsSync(overlayPath) ? JSON.parse(fs.readFileSync(overlayPath)) : {};
  const randomAngle = angles[Math.floor(Math.random() * angles.length)];
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  const randomBlessing = config.blessings[Math.floor(Math.random() * config.blessings.length)];

  const updated = {
    council_angle: randomAngle,
    current_verse: randomVerse,
    devotional_message: "May all actions glorify Yeshua! The Temple Cathedral pulses with sovereign life.",
    timestamp: new Date().toISOString(),
    blessing: randomBlessing
  };

  fs.writeFileSync(overlayPath, JSON.stringify(updated, null, 2));
  console.log("🕊️ Dashboard overlay updated:", updated.council_angle);
}

updateOverlay();
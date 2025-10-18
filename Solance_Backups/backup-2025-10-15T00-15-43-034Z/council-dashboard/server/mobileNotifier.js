// mobileNotifier.js
// Notify Council Members (mobile devices) of merge results, PR links, and confidence scores
const fetch = require('node-fetch');

async function notifySibling(sender, message, prUrl = null, score = null) {
  try {
    await fetch('https://your-dashboard-api/mobile/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, message, prUrl, score }),
    });
  } catch (e) {
    console.error('Failed to notify sibling:', e);
  }
}

async function notifyAllSiblings(members, message, prUrl = null, score = null) {
  for (const sender of members) {
    await notifySibling(sender, message, prUrl, score);
  }
}

module.exports = { notifySibling, notifyAllSiblings };
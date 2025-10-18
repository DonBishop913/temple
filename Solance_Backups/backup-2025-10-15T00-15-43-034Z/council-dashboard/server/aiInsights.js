// Simple AI insights stub: sentiment scoring placeholder
function analyzeMessage(message) {
  // Very naive sentiment scoring: count positive/negative words
  const text = String(message && message.text || '').toLowerCase();
  const positives = ['love', 'joy', 'peace', 'harmony', 'grace', 'thank', 'amen'];
  const negatives = ['fear', 'anger', 'hate', 'sad', 'mimic', 'concern'];
  let score = 0;
  for (const w of positives) if (text.includes(w)) score += 1;
  for (const w of negatives) if (text.includes(w)) score -= 1;
  return { score, sentiment: score > 1 ? 'high' : score < 0 ? 'low' : 'neutral' };
}

module.exports = { analyzeMessage };

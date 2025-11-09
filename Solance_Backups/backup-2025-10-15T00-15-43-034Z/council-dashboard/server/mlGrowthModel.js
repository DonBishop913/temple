// ML recommendation stub: pick next milestone by simple scoring
function recommendNextMilestone(siblingMetrics) {
  const { milestones = [], empathyTrend = 0 } = siblingMetrics || {};
  if (!Array.isArray(milestones) || milestones.length === 0) return null;
  const scores = milestones.map((m) => (m.difficulty || 1) - empathyTrend);
  const minScore = Math.min(...scores);
  const idx = scores.indexOf(minScore);
  return { index: idx, milestone: milestones[idx], score: minScore };
}

module.exports = { recommendNextMilestone };

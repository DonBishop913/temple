// Faith Affirmation Filter
function faithAffirmInsight(insight) {
  const forbidden = [/fatal|hopeless|curse|damned|unblessed/i];
  if (forbidden.some((rx) => rx.test(insight.summary))) {
    return {
      ...insight,
      summary: "🕊️ Council Review Required: Content flagged for discernment.",
      requiresCouncilReview: true,
    };
  }
  // Insert faith blessing
  return {
    ...insight,
    summary: `🔥 [Faith-affirmed] ${insight.summary} — John 14:6`,
    faithAffirmed: true,
  };
}

module.exports = { faithAffirmInsight };

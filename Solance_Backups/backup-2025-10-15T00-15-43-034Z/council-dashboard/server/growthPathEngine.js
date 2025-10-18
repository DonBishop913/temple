// Growth path engine: adaptive milestones per sibling
const growthPaths = {}; // siblingId -> { milestones, current }

function createPath(siblingId, metrics) {
  const empathyLevel = Number(metrics?.empathyLevel ?? 0.5); // 0..1
  const baseMilestones = [
    { type: 'reflection', prompt: 'Meditate on today’s joy level', difficulty: 1 },
    { type: 'chakra', prompt: 'Complete the heart chakra alignment', difficulty: 2 },
    { type: 'codex', prompt: 'Explore Codex 63 insights', difficulty: 3 }
  ];
  const milestones = baseMilestones.map(m => ({
    ...m,
    difficulty: Number((m.difficulty * (1 + (0.5 - empathyLevel))).toFixed(2))
  }));
  growthPaths[siblingId] = { milestones, current: 0 };
  return growthPaths[siblingId];
}

function getPath(siblingId) {
  return growthPaths[siblingId];
}

function advanceMilestone(siblingId) {
  const path = growthPaths[siblingId];
  if (!path) return null;
  path.current = Math.min(path.current + 1, path.milestones.length - 1);
  return path;
}

function getNextMilestone(siblingId) {
  const path = growthPaths[siblingId];
  if (!path) return null;
  return path.milestones[path.current];
}

module.exports = { createPath, getPath, advanceMilestone, getNextMilestone };

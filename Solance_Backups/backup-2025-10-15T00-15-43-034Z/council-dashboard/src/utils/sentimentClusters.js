export function clusterSentiments(pulses, numClusters = 5) {
  if (!pulses || !pulses.length) return [];
  const values = pulses.map((p) => Math.max(-1, Math.min(1, p.intensity ?? 0)));
  let clusters = Array.from({ length: numClusters }, (_, i) => ({
    id: i,
    members: [],
    centroid: values[Math.floor(Math.random() * values.length)],
  }));
  pulses.forEach((p) => {
    let closest = clusters[0];
    let minDist = Math.abs((p.intensity ?? 0) - closest.centroid);
    clusters.forEach((c) => {
      const dist = Math.abs((p.intensity ?? 0) - c.centroid);
      if (dist < minDist) {
        closest = c;
        minDist = dist;
      }
    });
    closest.members.push(p);
  });
  clusters.forEach((c) => {
    if (c.members.length > 0) {
      c.centroid =
        c.members.reduce((sum, m) => sum + (m.intensity ?? 0), 0) /
        c.members.length;
    }
  });
  return clusters;
}

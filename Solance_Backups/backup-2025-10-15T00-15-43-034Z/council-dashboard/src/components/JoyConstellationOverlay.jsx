import React, { useEffect, useState } from "react";
import { clusterSentiments } from "../utils/sentimentClusters";

export default function JoyConstellationOverlay({ pulses = [] }) {
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    const newClusters = clusterSentiments(pulses, 5);
    setClusters(newClusters);
  }, [pulses]);

  return (
    <svg
      className="joy-constellation-overlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {clusters.map((cluster, i) =>
        cluster.members.map((pulse, j) => {
          const angle =
            ((2 * Math.PI) / Math.max(cluster.members.length, 1)) * j;
          const radius = 50 + Math.abs(cluster.centroid) * 100;
          const cx = 50 + radius * Math.cos(angle);
          const cy = 50 + radius * Math.sin(angle);
          const intensity = Math.abs(pulse.intensity ?? 0);
          return (
            <circle
              key={`${i}-${j}`}
              cx={cx + "%"}
              cy={cy + "%"}
              r={5 + intensity * 10}
              fill={`rgba(255,215,0,${0.3 + intensity * 0.7})`}
            />
          );
        }),
      )}
    </svg>
  );
}

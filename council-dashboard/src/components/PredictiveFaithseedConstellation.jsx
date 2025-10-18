import React, { useEffect, useState } from 'react';
import NodeInsightPanel from './NodeInsightPanel';

// NOTE: This component expects pulses with nodeId, forecast, joyProbability, nextPulseTime
export default function PredictiveFaithseedConstellation({ pulses = [] }) {
  const [clusters, setClusters] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    // Simple placement using polar coords; in future map to real positions
    setClusters(pulses);
  }, [pulses]);

  const handleNodeClick = (node) => setSelectedNode(node);

  return (
    <>
      <svg className="faithseed-constellation" style={{ width: '100%', height: '100%', pointerEvents: 'auto', position: 'absolute', top: 0, left: 0 }}>
        {clusters.map((pulse, i) => {
          const radius = 50 + (pulse.forecast ?? 0) * 80;
          const angle = (2 * Math.PI / Math.max(clusters.length, 1)) * i;
          const cx = 50 + radius * Math.cos(angle);
          const cy = 50 + radius * Math.sin(angle);
          const intensity = Math.abs(pulse.forecast ?? 0);
          return (
            <circle
              key={pulse.nodeId ?? i}
              cx={cx + '%'}
              cy={cy + '%'}
              r={5 + intensity * 12}
              fill={`rgba(255,215,0,${0.3 + intensity * 0.7})`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(pulse)}
            />
          );
        })}
      </svg>

      {selectedNode && (
        <NodeInsightPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </>
  );
}

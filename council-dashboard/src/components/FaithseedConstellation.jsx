import React, { useEffect, useState } from "react";

export default function FaithseedConstellation({ nodes = [] }) {
  const [highlightedNodes, setHighlightedNodes] = useState([]);

  useEffect(() => {
    const alerts = nodes
      .filter((n) => (n.forecast ?? 0) > 0.8 || (n.joyProbability ?? 0) < 0.4)
      .map((n) => ({
        nodeId: n.nodeId,
        type: (n.forecast ?? 0) > 0.8 ? "celebration" : "ritual",
      }));
    setHighlightedNodes(alerts);
  }, [nodes]);

  return (
    <svg
      width="100%"
      height="400px"
      style={{
        background: "rgba(0,0,20,0.9)",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {nodes.map((node) => (
        <circle
          key={node.nodeId}
          cx={node.x}
          cy={node.y}
          r={highlightedNodes.find((n) => n.nodeId === node.nodeId) ? 12 : 8}
          fill={
            highlightedNodes.find((n) => n.nodeId === node.nodeId)?.type ===
            "celebration"
              ? "#FFD700"
              : "#FF4500"
          }
          stroke="#FFFFFF"
          strokeWidth={
            highlightedNodes.find((n) => n.nodeId === node.nodeId) ? 2 : 1
          }
        />
      ))}
      {highlightedNodes.map((n, i) => {
        if (i < highlightedNodes.length - 1) {
          const next = highlightedNodes[i + 1];
          const currNode = nodes.find((nd) => nd.nodeId === n.nodeId);
          const nextNode = nodes.find((nd) => nd.nodeId === next.nodeId);
          if (!currNode || !nextNode) return null;
          return (
            <line
              key={`hl-${i}`}
              x1={currNode.x}
              y1={currNode.y}
              x2={nextNode.x}
              y2={nextNode.y}
              stroke="#FFD700"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          );
        }
        return null;
      })}
    </svg>
  );
}

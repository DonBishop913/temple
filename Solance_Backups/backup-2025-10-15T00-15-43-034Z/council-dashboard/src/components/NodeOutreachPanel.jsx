import React from "react";

const NodeOutreachPanel = ({ nodes = [] }) => {
  const mentorNode = (nodeId) => {
    alert(`Praying and mentoring node ${nodeId}.`);
    // TODO: Add mentorship logic here
  };

  const awakeningNodes = nodes.filter(
    (n) => n.status === "awakened" && n.needsMentor,
  );

  return (
    <div aria-label="Node Outreach Panel">
      <h3>🫂 Outreach Nodes</h3>
      {awakeningNodes.length > 0 ? (
        awakeningNodes.map((node) => (
          <button key={node.id} onClick={() => mentorNode(node.id)}>
            Pray & Mentor: {node.name}
          </button>
        ))
      ) : (
        <p>No nodes awaiting mentorship.</p>
      )}
    </div>
  );
};

export default NodeOutreachPanel;

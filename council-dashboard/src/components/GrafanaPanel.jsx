import React from "react";

const GrafanaPanel = ({ src, title = "Grafana Panel", height = 300 }) => {
  if (!src) return null;
  return (
    <div className="metrics-panel" aria-label={title}>
      <iframe
        src={src}
        width="100%"
        height={height}
        frameBorder="0"
        title={title}
      />
    </div>
  );
};

export default GrafanaPanel;

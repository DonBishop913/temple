import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const YELLOW_MIN = 0.45;
const YELLOW_MAX = 0.65;

export default function AlertBanner({ socket }) {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!socket) return;

    function handleUpdate(data) {
      // data may contain {nodes: [{nodeID, coherenceLevel, errorRate, ...}, ...]}
      const nodes = data.nodes || (data.node ? [data.node] : []);
      const yellowNodes = nodes.filter(
        (n) =>
          typeof n.coherenceLevel === "number" &&
          n.coherenceLevel >= YELLOW_MIN &&
          n.coherenceLevel < YELLOW_MAX,
      );
      if (yellowNodes.length > 0) {
        setMessage(`Warning: ${yellowNodes.length} node(s) in Yellow zone`);
        setActive(true);
      } else {
        setActive(false);
      }
    }

    socket.on("dashboard-update", handleUpdate);
    socket.on("handshake", handleUpdate);

    return () => {
      socket.off("dashboard-update", handleUpdate);
      socket.off("handshake", handleUpdate);
    };
  }, [socket]);

  if (!active) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#FFCC00",
          color: "#222",
          padding: "10px 20px",
          borderRadius: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          animation: "pulse 1.2s infinite",
        }}
      >
        <strong>Attention:</strong>&nbsp;{message}
      </div>
      <style>{`@keyframes pulse { 0% { transform: scale(1) } 50% { transform: scale(1.03) } 100% { transform: scale(1) } }`}</style>
    </div>
  );
}

AlertBanner.propTypes = {
  socket: PropTypes.object,
};

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FaithseedForecastPanel({ enabled = true }) {
  const [nodes, setNodes] = useState([]);
  useEffect(() => {
    if (!enabled) return;
    const fetchNodes = async () => {
      const res = await axios.get("/api/nodes/status");
      setNodes(res.data);
    };
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div className="absolute top-0 right-0 w-80 bg-gray-800 p-4 rounded shadow-lg text-white">
      <h2 className="text-lg font-bold mb-2">Faithseed Forecast</h2>
      {nodes.map((node) => (
        <div key={node.id} className="mb-1">
          {node.name}: {Math.round((node.predictedJoy || 0) * 100)}% predicted
          joy
        </div>
      ))}
    </div>
  );
}

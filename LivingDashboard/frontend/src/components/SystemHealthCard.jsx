import React, { useEffect, useState } from "react";

function SystemHealthCard() {
  const [health, setHealth] = useState({});

  useEffect(() => {
    const fetchHealth = () => {
      fetch("http://localhost:4000/api/system_health")
        .then((res) => res.json())
        .then(setHealth)
        .catch(console.error);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 rounded-2xl shadow-lg bg-green-50 border border-green-200">
      <h4 className="text-xl font-bold text-green-800 mb-2">System Health</h4>
      <div className="space-y-1 text-sm">
        <p>
          <span className="font-medium">Status:</span> {health.status}
        </p>
        <p>
          <span className="font-medium">Errors:</span> {health.errorCount || 0}
        </p>
        <p>
          <span className="font-medium">Uptime:</span>{" "}
          {health.uptimeSeconds
            ? `${Math.floor(health.uptimeSeconds / 60)}m ${Math.floor(health.uptimeSeconds % 60)}s`
            : "N/A"}
        </p>
        <p>
          <span className="font-medium">Faith:</span>{" "}
          {health.john14_6 ? "🕊️ Active" : "Inactive"}
        </p>
      </div>
    </div>
  );
}

export default SystemHealthCard;

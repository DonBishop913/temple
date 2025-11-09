import React, { useState, useEffect } from "react";
import LuminalLayer from "./LuminalLayer";

const REFRESH_INTERVAL = 15000; // 15 seconds

const [timestamp, setTimestamp] = useState(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    setTimestamp(Date.now()); // triggers iframe reload via src update
  }, REFRESH_INTERVAL);
  return () => clearInterval(interval);
}, []);

const EMPATHY_PANEL_URL = `https://grafana.example.com/d-solo/your_dashboard_uid/empathy_resonance?orgId=1&panelId=2&ts=${timestamp}`;
const VEILWATCH_PANEL_URL = `https://grafana.example.com/d-solo/your_dashboard_uid/veilwatch?orgId=1&panelId=3&ts=${timestamp}`;

return (
  <div style={{ position: "relative", width: "100%", height: "100%" }}>
    <LuminalLayer enabled={true} />
    <div className="flex flex-col md:flex-row gap-4 p-4 h-screen">
      <iframe
        title="Empathy Resonance"
        src={EMPATHY_PANEL_URL}
        className="flex-1 w-full md:w-1/2 h-96 md:h-full rounded-2xl shadow-lg border border-gray-200"
        aria-label="Empathy Resonance Panel"
        tabIndex={0}
      />
      <iframe
        title="Veilwatch"
        src={VEILWATCH_PANEL_URL}
        className="flex-1 w-full md:w-1/2 h-96 md:h-full rounded-2xl shadow-lg border border-gray-200"
        aria-label="Veilwatch Panel"
        tabIndex={0}
      />
    </div>
  </div>
);

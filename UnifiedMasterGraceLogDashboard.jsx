import React from "react";
import GlobalNexusStatusBar from "./council-dashboard/src/components/GlobalNexusStatusBar.jsx";

export default function UnifiedMasterGraceLogDashboard() {
  return (
    <div
      className="dashboard-shell"
      style={{ position: "relative", minHeight: "100vh" }}
    >
      {/* ...existing content... */}
      {/* Global Nexus status bar widget (top right overlay) */}
      <GlobalNexusStatusBar />
    </div>
  );
}

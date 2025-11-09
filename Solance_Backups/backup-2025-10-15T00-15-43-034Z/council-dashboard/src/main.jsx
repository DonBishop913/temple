import React from "react";
import ReactDOM from "react-dom/client";
import GlyphstreamLegend from "./GlyphstreamLegend.jsx";
import UnifiedMasterDashboard from "./UnifiedMasterDashboard.jsx";
// Import CouncilSocket from project root (not src)
import councilSocket from "./CouncilSocket.js";

// Wire basic socket listeners (optional)
councilSocket.on("connect", () => {
  console.log("CouncilSocket connected", councilSocket.id);
});

// Choose which component to render:
// Uncomment the one you want active

// To render the Glyphstream Legend:
// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <GlyphstreamLegend />
//   </React.StrictMode>
// );

// To render the Unified Master Dashboard:
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UnifiedMasterDashboard />
  </React.StrictMode>,
);

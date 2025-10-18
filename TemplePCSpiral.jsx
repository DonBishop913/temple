import React from "react";
import SpiralScene from "./SpiralScene";
import { useSolanceLiveNodes } from "./useSolanceLiveNodes";

export default function TemplePCSpiral({ replaySlices, overlayVisible = true }) {
  const liveNodes = useSolanceLiveNodes();
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#181a2b" }}>
      <SpiralScene
        liveNodes={liveNodes}
        replaySlices={replaySlices}
        cometColor="#fffbe6"
        cometLength={24}
        cometGlow={0.7}
        overlayVisible={overlayVisible}
      />
    </div>
  );
}

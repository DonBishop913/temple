import React, { useEffect, useState } from "react";
import EventBus from "../utils/EventBus";
import MiracleAlertPanel from "./MiracleAlertPanel";
import JoyConstellationOverlay from "./JoyConstellationOverlay";
import LuminalGlowLayer from "./LuminalGlowLayer";

export default function UnifiedOverlay({
  siblingIds,
  predictedEngagement = [],
}) {
  const [pulses, setPulses] = useState([]);

  useEffect(() => {
    // Fetch predictive + sentiment pulses from backend
    const fetchPulses = async () => {
      const res = await fetch(
        `/api/faithseed/predictive/${siblingIds.join(",")}`,
      );
      const data = await res.json();
      EventBus.emit("unifiedPulse", data);
    };
    fetchPulses();
    const interval = setInterval(fetchPulses, 5000);
    EventBus.on("unifiedPulse", setPulses);
    return () => {
      clearInterval(interval);
      EventBus.all.clear();
    };
  }, [siblingIds]);

  return (
    <>
      <MiracleAlertPanel pulses={pulses} />
      <JoyConstellationOverlay pulses={pulses} />
      <LuminalGlowLayer
        pulses={pulses}
        predictedEngagement={predictedEngagement}
      />
    </>
  );
}

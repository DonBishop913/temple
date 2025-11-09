import { useEffect, useState } from "react";

// Connects to Grok/SpaceX/Starlink live telemetry
export default function useGrokTelemetry() {
  const [spaceData, setSpaceData] = useState({ planets: [], missions: [] });

  useEffect(() => {
    const ws = new WebSocket(
      "wss://api.grok.spacex.starlink.telemetry/v1/live",
    );
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setSpaceData(parsed);
      } catch (e) {
        console.error("Grok telemetry parse error", e);
      }
    };
    ws.onerror = (e) => {
      console.error("Grok telemetry connection error", e);
    };
    return () => ws.close();
  }, []);

  return spaceData;
}

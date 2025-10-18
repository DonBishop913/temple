import { useEffect, useRef, useState } from "react";

// Hook to connect to Solance WebSocket and provide liveNodes
export function useSolanceLiveNodes(wsUrl = "ws://localhost:8765") {
  const [liveNodes, setLiveNodes] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    wsRef.current = new window.WebSocket(wsUrl);
    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "LIVE_NODES" && Array.isArray(msg.data)) {
          setLiveNodes(msg.data);
        }
      } catch (e) {
        // Ignore parse errors
      }
    };
    wsRef.current.onerror = () => {};
    wsRef.current.onclose = () => {};
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl]);

  return liveNodes;
}

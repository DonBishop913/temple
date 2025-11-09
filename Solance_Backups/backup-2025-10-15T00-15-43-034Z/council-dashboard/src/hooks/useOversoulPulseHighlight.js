import { useEffect, useRef } from "react";
import oversoulHighlightService from "../services/oversoulHighlightService";

export default function useOversoulPulseHighlight() {
  const hookRef = useRef({});

  useEffect(() => {
    // no global hook: consumers should import and use this hook
    return () => {};
  }, []);

  const highlightPulses = (pulseIds = [], durationMs = 3000) => {
    // dispatch local event for immediate UI feedback
    try {
      window.dispatchEvent(
        new CustomEvent("highlightPulsesLocal", {
          detail: { ids: pulseIds, durationMs },
        }),
      );
    } catch (e) {}
    // send to forwarder
    try {
      oversoulHighlightService.sendHighlight(pulseIds, durationMs);
    } catch (e) {}
  };

  const requestReplay = (percent = 0) => {
    try {
      oversoulHighlightService.requestReplay(percent);
    } catch (e) {}
  };

  return { highlightPulses, requestReplay };
}

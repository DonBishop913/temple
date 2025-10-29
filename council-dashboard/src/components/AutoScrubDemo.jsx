import { useEffect, useRef } from "react";
import { useOversoulController } from "../hooks/useOversoulController";

/**
 * AutoScrubDemo
 * Cycles through a list of pulse IDs, highlights each one and scrubs to a synthetic timestamp.
 * Useful for a quick interactive smoke-test of the controls.
 */
export default function AutoScrubDemo({ pulseIds = [], intervalMs = 300 }) {
  const { play, pause, scrub, highlight } = useOversoulController();
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!pulseIds || !pulseIds.length) return;
    // start
    try {
      play && play();
    } catch (e) {}

    timerRef.current = setInterval(() => {
      const id = pulseIds[idxRef.current % pulseIds.length];
      try {
        highlight && highlight([id]);
      } catch (e) {}
      try {
        scrub && scrub(Date.now());
      } catch (e) {}
      idxRef.current += 1;
    }, intervalMs);

    return () => {
      clearInterval(timerRef.current);
      try {
        pause && pause();
      } catch (e) {}
    };
  }, [pulseIds, intervalMs, play, pause, scrub, highlight]);

  return null;
}

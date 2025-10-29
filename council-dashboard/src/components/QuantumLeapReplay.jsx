import { useEffect, useRef, useState } from "react";
import { useOversoulController } from "../hooks/useOversoulController";

/**
 * QuantumLeapReplay
 * Connects to the forwarder to request a portion of the replay buffer and then
 * steps through pulses, scrubbing and highlighting each one.
 */
export default function QuantumLeapReplay({
  batchSize = 500,
  intervalMs = 100,
  autoStart = true,
}) {
  const { play, pause, scrub, highlight } = useOversoulController();
  const [pulses, setPulses] = useState([]);
  const idxRef = useRef(0);
  const timerRef = useRef(null);

  // Fetch replay batch via a short-lived WS request
  useEffect(() => {
    const url = process.env.OVERSOUL_WS_URL || "ws://127.0.0.1:8080";
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      return;
    }
    ws.onopen = () => {
      try {
        ws.send(
          JSON.stringify({ type: "request_replay", percent: 1, batchSize }),
        );
      } catch (e) {}
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg && (msg.type === "replay" || msg.type === "replay_pulses")) {
          const arr = Array.isArray(msg.payload) ? msg.payload : [];
          setPulses(arr.slice(-batchSize));
        }
      } catch (e) {}
    };
    ws.onerror = () => {
      /* ignore */
    };
    const t = setTimeout(() => {
      try {
        ws.close();
      } catch (e) {}
    }, 5000);
    return () => {
      clearTimeout(t);
      try {
        ws.close();
      } catch (e) {}
    };
  }, [batchSize]);

  // Playback loop
  useEffect(() => {
    if (!pulses || pulses.length === 0 || !autoStart) return;
    try {
      play && play();
    } catch (e) {}
    timerRef.current = setInterval(() => {
      const p = pulses[idxRef.current % pulses.length];
      if (!p) return;
      try {
        highlight && highlight([p.id || p.unique || p.t || p.timestamp]);
      } catch (e) {}
      try {
        scrub && scrub(p.timestamp || p.t || Date.now());
      } catch (e) {}
      idxRef.current += 1;
    }, intervalMs);

    return () => {
      clearInterval(timerRef.current);
      try {
        pause && pause();
      } catch (e) {}
    };
  }, [pulses, intervalMs, autoStart, play, pause, scrub, highlight]);

  return null;
}

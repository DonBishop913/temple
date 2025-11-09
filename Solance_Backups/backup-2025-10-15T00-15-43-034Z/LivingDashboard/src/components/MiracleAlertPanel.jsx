import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./MiracleAlertPanel.css";
// Optional helpers from JoyParticleOverlay; guard if not present
let playBurstChime = () => {}; // no-op default
let getEmpathyLevel = () => 1; // default empathy
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const overlayHelpers = require("./JoyParticleOverlay");
  if (overlayHelpers.playBurstChime)
    playBurstChime = overlayHelpers.playBurstChime;
  if (overlayHelpers.getEmpathyLevel)
    getEmpathyLevel = overlayHelpers.getEmpathyLevel;
} catch {}

// Unify server port references to 3000 for council-dashboard API
const DASHBOARD_API = "http://localhost:3000/api/nodeHealth";
const ALERTS_API = "http://localhost:3000/api/alerts"; // SSE endpoint

const STATUS_COLORS = {
  online: "green",
  stalled: "orange",
  offline: "red",
};

export default function MiracleAlertPanel() {
  const [nodes, setNodes] = useState([]);
  const [pulses, setPulses] = useState({}); // nodeId -> { severity, expiresAt }
  const pulseTimeouts = useRef(new Map());
  const [demoMode, setDemoMode] = useState(false);
  const [maxFlare, setMaxFlare] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]); // recent alerts for overlay
  const [demoSequence, setDemoSequence] = useState(false);
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Exported pulse trigger for external/tests usage and SSE
  // Drives row shimmer, overlay pulse, and optional sound with dynamic intensity
  const triggerPulse = (alert) => {
    // Normalize inputs
    const nodeId = alert?.nodeId ?? alert?.id;
    const severity = alert?.severity ?? "warning";
    if (!nodeId) return;

    // Map severity to intensity multiplier
    const severityMap = {
      info: 0.7,
      stalled: 1,
      offline: 1.4,
      warning: 1,
      critical: 1.6,
    };
    const intensity = severityMap[severity] || 1;
    const empathy = Number(getEmpathyLevel(nodeId)) || 1; // 0..1 recommended
    const pulseStrength = Math.max(0.5, Math.min(2, intensity * empathy));

    // 1) Row shimmer by class toggle + dynamic duration
    const rowEl = document.querySelector(
      `#node-row-${CSS.escape(String(nodeId))}`,
    );
    if (rowEl) {
      // Use CSS var to control animation speed
      rowEl.style.setProperty(
        "--row-shimmer-duration",
        `${(1.2 / pulseStrength).toFixed(2)}s`,
      );
      rowEl.classList.add("shimmer-pulse");
      setTimeout(
        () => {
          rowEl.classList.remove("shimmer-pulse");
          rowEl.style.removeProperty("--row-shimmer-duration");
        },
        Math.round(1200 / pulseStrength),
      );
    }

    // Maintain React state for row highlight background
    const expiresAt = Date.now() + Math.round(1500 / pulseStrength);
    setPulses((prev) => ({ ...prev, [nodeId]: { severity, expiresAt } }));
    const prevTimeout = pulseTimeouts.current.get(nodeId);
    if (prevTimeout) clearTimeout(prevTimeout);
    const t = setTimeout(
      () => {
        setPulses((prev) => {
          const copy = { ...prev };
          delete copy[nodeId];
          return copy;
        });
        pulseTimeouts.current.delete(nodeId);
      },
      Math.round(1600 / pulseStrength),
    );
    pulseTimeouts.current.set(nodeId, t);

    // 2) Overlay pulse by class toggle with severity-based class
    const overlayEl = document.querySelector("#joy-particle-overlay");
    const sevClass = `overlay-pulse-${severity}`;
    if (overlayEl) {
      // Set opacity based on strength for subtle glow
      const base = 0.25;
      const max = 0.9;
      const op = Math.max(
        base,
        Math.min(max, base + 0.4 * (pulseStrength - 0.5)),
      );
      overlayEl.style.opacity = String(op);
      overlayEl.classList.add(sevClass);
      const duration = Math.round(1200 / pulseStrength);
      setTimeout(() => {
        overlayEl.classList.remove(sevClass);
        overlayEl.style.opacity = "";
      }, duration);
    }

    // 3) Optional sound cue scaled by strength
    try {
      playBurstChime(severity, pulseStrength);
    } catch {}

    // Emit a global DOM event for any additional listeners
    const evt = new CustomEvent("node-alert", {
      detail: { nodeId, severity, pulseStrength },
    });
    window.dispatchEvent(evt);
  };

  useEffect(() => {
    const fetchNodeHealth = async () => {
      try {
        const { data } = await axios.get(DASHBOARD_API);
        setNodes(data.nodes || []);
      } catch (e) {
        console.error("Error fetching node health:", e);
      }
    };
    fetchNodeHealth();
    const interval = setInterval(fetchNodeHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // SSE hook for real-time node alerts
  useEffect(() => {
    let evtSource;
    try {
      evtSource = new EventSource(ALERTS_API);
      evtSource.onmessage = (e) => {
        try {
          const alert = JSON.parse(e.data);
          if (alert && alert.nodeId) {
            triggerPulse(alert);
            // keep recent alerts for overlay scaling
            setActiveAlerts((prev) => {
              const now = Date.now();
              const recent = prev.filter((a) => now - a.ts < 2000);
              return [
                ...recent,
                {
                  nodeId: alert.nodeId,
                  severity: alert.severity || "warning",
                  empathy: getEmpathyLevel(alert.nodeId),
                  ts: now,
                },
              ];
            });
          } else if (alert && !alert.nodeId && alert.severity) {
            // Global pulse without a specific node (e.g., harmony low)
            const evt = new CustomEvent("node-alert", {
              detail: { nodeId: "global", severity: alert.severity },
            });
            window.dispatchEvent(evt);
          }
        } catch {}
      };
    } catch {}
    return () => {
      try {
        evtSource && evtSource.close();
      } catch {}
    };
  }, []);

  // expose for tests via window (optional)
  useEffect(() => {
    // Attach a safe reference for test triggers
    window.__triggerMiraclePulse = triggerPulse;
    return () => {
      try {
        delete window.__triggerMiraclePulse;
      } catch {}
    };
  }, []);

  // Derive severity from node status
  const statusSeverity = (status) => {
    if (status === "offline") return "offline";
    if (status === "stalled") return "stalled";
    return "online";
  };

  // Watch node list for stalled/offline and trigger pulses
  useEffect(() => {
    nodes.forEach((n) => {
      const sev = statusSeverity(n.status);
      if (sev === "stalled" || sev === "offline") {
        triggerPulse({ nodeId: n.id, severity: sev });
        setActiveAlerts((prev) => {
          const now = Date.now();
          const recent = prev.filter((a) => now - a.ts < 2000);
          return [
            ...recent,
            {
              nodeId: n.id,
              severity: sev,
              empathy: getEmpathyLevel(n.id),
              ts: now,
            },
          ];
        });
      }
    });
    // Clean up expired pulses defensively
    const now = Date.now();
    setPulses((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        if (copy[k].expiresAt <= now) delete copy[k];
      });
      return copy;
    });
  }, [nodes]);

  // Demo Mode: simulate random alerts
  useEffect(() => {
    if (!demoMode) return;
    const interval = setInterval(() => {
      const nodeIdx = Math.ceil(Math.random() * 7);
      const severities = ["info", "warning", "critical"];
      const severity =
        severities[Math.floor(Math.random() * severities.length)];
      const empathy = Math.random();
      const alert = { nodeId: `node-${nodeIdx}`, severity, empathy };
      triggerPulse(alert);
      setActiveAlerts((prev) => {
        const now = Date.now();
        const recent = prev.filter((a) => now - a.ts < 2000);
        return [
          ...recent,
          { nodeId: alert.nodeId, severity: alert.severity, empathy, ts: now },
        ];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [demoMode]);

  // Max Celestial Flare: trigger all nodes simultaneously
  useEffect(() => {
    if (!maxFlare) return;
    const now = Date.now();
    const alerts = Array.from({ length: 7 }, (_, i) => ({
      nodeId: `node-${i + 1}`,
      severity: "critical",
      empathy: 1,
    }));
    alerts.forEach((a) => triggerPulse(a, 1.5));
    setActiveAlerts(alerts.map((a) => ({ ...a, ts: now })));
    // Play harmonic burst chime if available
    try {
      const { playMaxFlareChime } = require("./JoyParticleOverlay");
      if (playMaxFlareChime) playMaxFlareChime();
    } catch {}
    const t = setTimeout(() => setMaxFlare(false), 2000);
    return () => clearTimeout(t);
  }, [maxFlare]);

  // Demo Sequence (escalating alerts) with optional looping
  useEffect(() => {
    if (!demoSequence) return;
    let loopTimeout;
    const runSequence = () => {
      const seq = [
        { type: "info", empathy: 0.3, delay: 0 },
        {
          type: "warning",
          empathy: 0.6,
          delay: Math.round(1000 / speedMultiplier),
        },
        {
          type: "critical",
          empathy: 0.9,
          delay: Math.round(2000 / speedMultiplier),
        },
        {
          type: "maxFlare",
          empathy: 1,
          delay: Math.round(3000 / speedMultiplier),
        },
      ];
      const startTs = Date.now();
      seq.forEach((step) => {
        setTimeout(() => {
          if (step.type === "maxFlare") {
            setMaxFlare(true);
          } else {
            const alerts = Array.from({ length: 7 }, (_, i) => ({
              nodeId: `node-${i + 1}`,
              severity: step.type,
              empathy: step.empathy,
              timestamp: Date.now(),
            }));
            alerts.forEach((alert) => triggerPulse(alert, 1));
            setActiveAlerts(alerts.map((a) => ({ ...a, ts: Date.now() })));
          }
        }, step.delay);
      });
      const total =
        seq[seq.length - 1].delay + Math.round(2000 / speedMultiplier);
      return total;
    };
    const startLoop = () => {
      const duration = runSequence();
      if (autoRepeat) {
        loopTimeout = setTimeout(startLoop, duration);
      } else {
        setTimeout(() => setDemoSequence(false), duration);
      }
    };
    startLoop();
    return () => {
      if (loopTimeout) clearTimeout(loopTimeout);
    };
  }, [demoSequence, autoRepeat, speedMultiplier]);

  return (
    <div
      className="miracle-alert-panel"
      role="region"
      aria-label="Council Node Health"
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 8,
          alignItems: "center",
        }}
      >
        <button onClick={() => setDemoMode((d) => !d)}>
          {demoMode ? "Stop Demo Mode" : "Start Demo Mode"}
        </button>
        <button onClick={() => setMaxFlare(true)}>
          Trigger Max Celestial Flare
        </button>
        <button onClick={() => setDemoSequence(true)}>
          Start Demo Sequence
        </button>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input
            type="checkbox"
            checked={autoRepeat}
            onChange={() => setAutoRepeat((v) => !v)}
          />{" "}
          Loop
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          Speed
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speedMultiplier}
            onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
          />
          <span>x{speedMultiplier.toFixed(1)}</span>
        </label>
      </div>
      {/* Background gradient underlay during Max Flare */}
      {(() => {
        try {
          const MaxFlareGradient = require("./MaxFlareGradient").default;
          return <MaxFlareGradient maxFlare={maxFlare} />;
        } catch {
          return null;
        }
      })()}
      {/* Overlay consumes recent alerts for dynamic particles */}
      {typeof document !== "undefined" &&
        // Lazy import to avoid SSR issues
        (() => {
          try {
            const JoyParticleOverlay = require("./JoyParticleOverlay").default;
            const {
              PredictiveMergeConstellation,
            } = require("./JoyParticleOverlay");
            return (
              <>
                <JoyParticleOverlay alerts={activeAlerts} maxFlare={maxFlare} />
                <PredictiveMergeConstellation />
              </>
            );
          } catch {
            return null;
          }
        })()}
      <h2>Council Node Health</h2>
      <table>
        <thead>
          <tr>
            <th>Node</th>
            <th>ID</th>
            <th>Status</th>
            <th>Last Update</th>
            <th>Empathy</th>
            <th>Breathstream</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => {
            const color = STATUS_COLORS[node.status] || "gray";
            const isPulsing = !!pulses[node.id];
            return (
              <tr
                key={node.id}
                id={`node-row-${node.id}`}
                style={{
                  backgroundColor:
                    node.status !== "online" ? `${color}20` : "transparent",
                }}
                className={`${isPulsing ? "row-shimmer" : ""}`}
              >
                <td>{node.name}</td>
                <td>{node.id}</td>
                <td style={{ color }}>{node.status}</td>
                <td>
                  {node.lastUpdate
                    ? new Date(node.lastUpdate).toLocaleTimeString()
                    : "—"}
                </td>
                <td>{node.empathyResonance ?? "—"}</td>
                <td>{node.breathstream ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`
        /* Base shimmer overlay */
        .row-shimmer { position: relative; }
        .row-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
          animation: shimmerPulse var(--row-shimmer-duration, 1.2s) ease-in-out 1;
          pointer-events: none;
        }
        @keyframes shimmerPulse {
          0% { opacity: 0; transform: translateX(-20%); }
          50% { opacity: 1; transform: translateX(20%); }
          100% { opacity: 0; transform: translateX(60%); }
        }

        /* Overlay pulse classes (JoyParticleOverlay should have #joy-particle-overlay element) */
        .overlay-pulse-warning { animation: overlayGlow 1.2s ease-in-out 1; }
        .overlay-pulse-stalled { animation: overlayGlow 1.2s ease-in-out 1; }
        .overlay-pulse-offline { animation: overlayGlowCritical 1.2s ease-in-out 1; }
        .overlay-pulse-critical { animation: overlayGlowCritical 1.2s ease-in-out 1; }

        @keyframes overlayGlow {
          0% { filter: drop-shadow(0 0 2px rgba(255, 255, 200, 0.2)); }
          50% { filter: drop-shadow(0 0 8px rgba(255, 255, 160, 0.8)); }
          100% { filter: drop-shadow(0 0 2px rgba(255, 255, 200, 0.2)); }
        }
        @keyframes overlayGlowCritical {
          0% { filter: drop-shadow(0 0 3px rgba(255, 120, 120, 0.3)); }
          50% { filter: drop-shadow(0 0 12px rgba(255, 80, 80, 1)); }
          100% { filter: drop-shadow(0 0 3px rgba(255, 120, 120, 0.3)); }
        }
      `}</style>
    </div>
  );
}

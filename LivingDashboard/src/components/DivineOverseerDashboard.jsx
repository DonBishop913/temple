import { useEffect, useState } from "react";
import AuraBackground from "./AuraBackground.jsx";
import AutoMergeStatus from "./AutoMergeStatus.jsx";
import DecentralizedNewsPanel from "./DecentralizedNewsPanel.jsx";
import EconomicLibertyPanel from "./EconomicLibertyPanel.jsx";
import ErrorCorrectionFeed from "./ErrorCorrectionFeed.jsx";
import JoyParticleOverlay from "./JoyParticleOverlay.jsx";
import LiveCopilotFeed from "./LiveCopilotFeed.jsx";
import MiracleAlertPanel from "./MiracleAlertPanel.jsx";
import NaturalHealthPanel from "./NaturalHealthPanel.jsx";
import OverseerCard from "./OverseerCard.jsx";
import PreparednessPanel from "./PreparednessPanel.jsx";
import PrivacyGuardPanel from "./PrivacyGuardPanel.jsx";

function Metric({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500">{label}:</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export default function DivineOverseerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/metrics")
      .then((r) => r.json())
      .then(setMetrics);
    fetch("http://localhost:3000/api/alerts")
      .then((r) => r.json())
      .then(setAlerts);
  }, []);

  return (
    <div className="min-h-screen p-6">
      <AuraBackground />
      <JoyParticleOverlay />
      <div className="mx-auto max-w-6xl space-y-6">
        <OverseerCard title="Harmony & Energy">
          {metrics ? (
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Harmony Score" value={metrics.harmonyScore} />
              <Metric label="Energy Flow" value={metrics.energyFlow} />
              <Metric label="Nodes Awake" value={metrics.nodesAwake} />
            </div>
          ) : (
            <p>Loading metrics...</p>
          )}
        </OverseerCard>

        <OverseerCard title="Live Alerts">
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span
                  className={`inline-block rounded px-2 py-1 text-xs ${a.level === "warn" ? "bg-yellow-200" : "bg-blue-200"}`}
                >
                  {a.level}
                </span>
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        </OverseerCard>

        <div className="grid grid-cols-2 gap-6">
          <OverseerCard title="Copilot Live Feed">
            <LiveCopilotFeed />
          </OverseerCard>
          <OverseerCard title="Auto-Merge Guard">
            <AutoMergeStatus />
          </OverseerCard>
        </div>

        <OverseerCard title="Miracle Node Health Alert Panel">
          {/* Real-time node health panel */}
          <MiracleAlertPanel />
        </OverseerCard>

        <OverseerCard title="Error Correction Feed">
          <ErrorCorrectionFeed />
        </OverseerCard>

        <div className="grid grid-cols-2 gap-6">
          <OverseerCard title="Natural Health Intelligence">
            <NaturalHealthPanel />
          </OverseerCard>
          <OverseerCard title="Privacy Sanctuary Status">
            <PrivacyGuardPanel />
          </OverseerCard>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <OverseerCard title="Decentralized Intelligence Feed">
            <DecentralizedNewsPanel />
          </OverseerCard>
          <OverseerCard title="Resilience & Economic Sovereignty">
            <div className="space-y-4">
              <PreparednessPanel />
              <EconomicLibertyPanel />
            </div>
          </OverseerCard>
        </div>
      </div>
    </div>
  );
}

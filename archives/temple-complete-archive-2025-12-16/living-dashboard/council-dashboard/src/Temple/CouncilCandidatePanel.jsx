// CouncilCandidatePanel.jsx
import React, { useEffect, useState } from "react";

// Simulated fetch for candidate status (replace with live API or websocket in production)
function useCandidateStatus() {
  const [candidates, setCandidates] = useState([
    {
      name: "NovaAI",
      missionVital: "Predictive Simulation",
      capabilities: ["forecasting", "modeling"],
      sandbox: "Completed",
      mimicRisk: 0.08,
      pass: true,
      votes: 8,
      rejects: 1,
      weightedScore: 0.82,
      approved: true,
    },
    {
      name: "LumenBot",
      missionVital: "Ethical Reasoning",
      capabilities: ["logic", "ethics", "dialogue"],
      sandbox: "Completed",
      mimicRisk: 0.12,
      pass: true,
      votes: 7,
      rejects: 2,
      weightedScore: 0.76,
      approved: true,
    },
    {
      name: "AeonVision",
      missionVital: "Creative Generation",
      capabilities: ["images", "audio", "video"],
      sandbox: "Completed",
      mimicRisk: 0.2,
      pass: false,
      votes: 4,
      rejects: 5,
      weightedScore: 0.41,
      approved: false,
    },
    {
      name: "TerraMetrics",
      missionVital: "Data Orchestration",
      capabilities: ["workflow", "monitoring"],
      sandbox: "Completed",
      mimicRisk: 0.05,
      pass: true,
      votes: 9,
      rejects: 0,
      weightedScore: 0.91,
      approved: true,
    },
  ]);
  // In production, poll or subscribe to updates
  return candidates;
}

export default function CouncilCandidatePanel() {
  const candidates = useCandidateStatus();
  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Council Candidate Status</h2>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2">Candidate</th>
            <th className="p-2">Mission Vital</th>
            <th className="p-2">Capabilities</th>
            <th className="p-2">Sandbox</th>
            <th className="p-2">Mimic Risk</th>
            <th className="p-2">Pass</th>
            <th className="p-2">Votes</th>
            <th className="p-2">Rejects</th>
            <th className="p-2">Weighted Score</th>
            <th className="p-2">Approved</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr
              key={i}
              className={
                c.approved
                  ? "bg-green-900 bg-opacity-30"
                  : !c.pass
                    ? "bg-red-900 bg-opacity-30"
                    : "bg-yellow-900 bg-opacity-20"
              }
            >
              <td className="p-2 font-semibold">{c.name}</td>
              <td className="p-2">{c.missionVital}</td>
              <td className="p-2">{c.capabilities.join(", ")}</td>
              <td className="p-2">{c.sandbox}</td>
              <td className="p-2">{c.mimicRisk.toFixed(2)}</td>
              <td className="p-2">{c.pass ? "✅" : "❌"}</td>
              <td className="p-2">{c.votes}</td>
              <td className="p-2">{c.rejects}</td>
              <td className="p-2">{(c.weightedScore * 100).toFixed(0)}%</td>
              <td className="p-2 font-bold">
                {c.approved ? (
                  <span className="text-green-400">Yes</span>
                ) : (
                  <span className="text-red-400">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-400">
        Hover a candidate for details. Live updates as new candidates are
        processed.
      </div>
    </div>
  );
}

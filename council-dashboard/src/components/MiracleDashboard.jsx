import React, { useState, useEffect } from "react";
import UnifiedDashboard from "./UnifiedDashboard";
import { JoyParticleOverlay } from "./JoyParticleOverlay";
import EmpathySoundCue from "./EmpathySoundCue";
import OversoulGradientLayer from "./OversoulGradientLayer";

  const [particleCluster, setParticleCluster] = useState(null);
  const [burstChimeEnabled, setBurstChimeEnabled] = useState(() => {
    const stored = localStorage.getItem('miracle_burst_chime');
    return stored === null ? true : stored === 'true';
  });
  const [chimeTimbre, setChimeTimbre] = useState(() => {
    return localStorage.getItem('miracle_burst_chime_timbre') || 'triangle';
  });

  useEffect(() => {
    localStorage.setItem('miracle_burst_chime', burstChimeEnabled);
  }, [burstChimeEnabled]);
  useEffect(() => {
    localStorage.setItem('miracle_burst_chime_timbre', chimeTimbre);
  }, [chimeTimbre]);

  return (
    <div id="miracle-dashboard" className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-50 bg-white/80 rounded shadow p-2 flex flex-col items-end gap-2" style={{minWidth:180}}>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={burstChimeEnabled}
            onChange={e => setBurstChimeEnabled(e.target.checked)}
            aria-label="Enable miracle burst chimes"
          />
          Miracle Burst Chimes
        </label>
        <label className="flex items-center gap-2 text-xs">
          Timbre:
          <select
            value={chimeTimbre}
            onChange={e => setChimeTimbre(e.target.value)}
            aria-label="Chime timbre"
            disabled={!burstChimeEnabled}
          >
            <option value="triangle">Subtle Bell (Triangle)</option>
            <option value="fm">FM Tone</option>
            <option value="harmonics">Layered Harmonics</option>
          </select>
        </label>
      </div>
      <UnifiedDashboard />
      <JoyParticleOverlay onClusterUpdate={setParticleCluster} />
      <EmpathySoundCue enableBurstChime={burstChimeEnabled} chimeTimbre={chimeTimbre} />
      <OversoulGradientLayer enabled={true} syncWithEmpathy={true} particleCluster={particleCluster} />
    </div>
  );


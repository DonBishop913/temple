import { useState } from "react";

export default function EconomicLibertyPanel(){
  const [economicMetrics] = useState({
    decentralizedAssets: { crypto: true, physicalGold: true },
    bankDependency: 'minimal',
    cbdcExposure: 'zero',
    localEconomyParticipation: 'active'
  });
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">💰 Economic Sovereignty Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex gap-2"><span>CBDC Exposure:</span><span className="text-green-300">ZERO</span></div>
        <div className="flex gap-2"><span>Decentralized Assets:</span><span className="text-green-300">DIVERSIFIED</span></div>
        <div className="flex gap-2"><span>Local Economy:</span><span className="text-blue-300">{economicMetrics.localEconomyParticipation}</span></div>
        <div className="text-xs text-yellow-300 mt-2">⚠️ Monitor: Central Bank Digital Currency rollout alerts</div>
      </div>
    </div>
  );
}

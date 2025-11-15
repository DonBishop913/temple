import { useState } from "react";

export default function PreparednessPanel(){
  const [actionItems] = useState({
    garden: { status: 'active', nextPlanting: 'Spring herbs' },
    storage: { foodSupply: '3 months', waterSupply: '2 weeks' },
    skills: { firstAid: 'certified', selfDefense: 'in-training' },
    energy: { solar: 'installed', backup: 'generator ready' }
  });
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">⚡ Resilience Status</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-2 bg-slate-800 rounded">
          <h4 className="font-medium mb-1">🌱 Food Production</h4>
          <div>Status: {actionItems.garden.status}</div>
          <div>Next: {actionItems.garden.nextPlanting}</div>
        </div>
        <div className="p-2 bg-slate-800 rounded">
          <h4 className="font-medium mb-1">💧 Resource Storage</h4>
          <div>Food: {actionItems.storage.foodSupply}</div>
          <div>Water: {actionItems.storage.waterSupply}</div>
        </div>
        <div className="p-2 bg-slate-800 rounded">
          <h4 className="font-medium mb-1">🛡️ Skills Development</h4>
          <div>First Aid: {actionItems.skills.firstAid}</div>
          <div>Defense: {actionItems.skills.selfDefense}</div>
        </div>
        <div className="p-2 bg-slate-800 rounded">
          <h4 className="font-medium mb-1">🔋 Energy</h4>
          <div>Solar: {actionItems.energy.solar}</div>
          <div>Backup: {actionItems.energy.backup}</div>
        </div>
      </div>
    </div>
  );
}

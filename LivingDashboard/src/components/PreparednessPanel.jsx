import { useEffect, useState } from "react";

const DEFAULTS = {
  garden: { status: 'inactive', nextPlanting: '' },
  storage: { foodSupply: '', waterSupply: '' },
  skills: { firstAid: '', selfDefense: '' },
  energy: { solar: '', backup: '' },
  lastUpdate: null
};

export default function PreparednessPanel(){
  const [actionItems, setActionItems] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:3000/api/preparedness")
      .then(r => r.ok ? r.json() : DEFAULTS)
      .then(json => { if(mounted) setActionItems({ ...DEFAULTS, ...json }); })
      .catch(() => { if(mounted) setActionItems(DEFAULTS); });
    return () => { mounted = false; };
  }, []);

  const markWaterCheckComplete = async () => {
    try {
      setSaving(true);
      const next = { storage: { ...actionItems.storage, waterSupply: 'checked' } };
      const res = await fetch("http://localhost:3000/api/preparedness", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      const json = await res.json();
      setActionItems({ ...actionItems, ...json });
    } finally {
      setSaving(false);
    }
  };

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
          <button onClick={markWaterCheckComplete} className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs" disabled={saving}>
            {saving ? 'Saving…' : 'Mark Water Check Complete'}
          </button>
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
      <div className="mt-2 text-xs text-gray-400">Last Update: {actionItems.lastUpdate || '—'}</div>
    </div>
  );
}

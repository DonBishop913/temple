import React from "react";

export default function PrivacyGuardPanel(){
  const [privacy, setPrivacy] = React.useState({ encryptionStatus:'active', dataLocality:'localhost', layerStatus:{}, externalConnections:0, lastAudit:'' });
  React.useEffect(()=>{
    fetch('/api/privacy-status').then(r=>r.json()).then(setPrivacy).catch(()=>{});
  },[]);
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">🔒 Privacy Sanctuary Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex gap-2"><span>Encryption:</span><span className={privacy.encryptionStatus==='active'?'text-green-300':'text-red-300'}>{(privacy.encryptionStatus||'').toUpperCase()}</span></div>
        <div className="flex gap-2"><span>Data Locality:</span><span className="text-blue-300">{privacy.dataLocality}</span></div>
        <div className="flex gap-2"><span>External Connections:</span><span className={privacy.externalConnections===0?'text-green-300':'text-yellow-300'}>{privacy.externalConnections}</span></div>
        <div className="mt-2 p-2 bg-slate-800 rounded">
          <div>Layer 1: {privacy.layerStatus?.layer1?.status} — {privacy.layerStatus?.layer1?.description}</div>
          <div>Layer 2: {privacy.layerStatus?.layer2?.status} — {privacy.layerStatus?.layer2?.description}</div>
          <div>Layer 3: {privacy.layerStatus?.layer3?.status} — {privacy.layerStatus?.layer3?.description}</div>
        </div>
        <div className="text-xs text-gray-400">Last audit: {privacy.lastAudit}</div>
      </div>
    </div>
  );
}

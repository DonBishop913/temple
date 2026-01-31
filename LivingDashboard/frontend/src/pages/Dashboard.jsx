import { useEffect, useState } from "react";
import CouncilReviewPanel from "../components/CouncilReviewPanel";
import DashboardCard from "../components/DashboardCard";
import ObserverCircleCard from "../components/ObserverCircleCard";
import SecurityDashboard from "../components/SecurityDashboard";
import SystemHealthCard from "../components/SystemHealthCard";
import TrainingGuide from "../components/TrainingGuide";
import VoiceHealButton from "../components/VoiceHealButton";

function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [config, setConfig] = useState([]);
  const [overflow, setOverflow] = useState({ launched: false });
  const [backendOnline, setBackendOnline] = useState(true);
  const [lastPing, setLastPing] = useState(null);
  const [apiToken, setApiToken] = useState("");
  const [integrity, setIntegrity] = useState(null);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [donations, setDonations] = useState([]);
  const [exportStatus, setExportStatus] = useState("");
  const [user] = useState({ name: "Bishop Donald", role: "Bishop" });
  const [showTraining, setShowTraining] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    // Fetch metrics
    fetch("http://localhost:4000/api/dashboard_metrics")
      .then((res) => res.json())
      .then(setMetrics)
      .catch(console.error);

    // Fetch alerts
    fetch("http://localhost:4000/api/alerts")
      .then((res) => res.json())
      .then(setAlerts)
      .catch(console.error);

    // Fetch council roles config
    fetch("/config/council_roles.json")
      .then((res) => res.json())
      .then(setConfig)
      .catch(console.error);

    // Fetch Overflow status
    fetch("http://localhost:4000/api/overflow")
      .then((res) => res.json())
      .then(setOverflow)
      .catch(console.error);

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetch("http://localhost:4000/api/dashboard_metrics")
        .then((res) => res.json())
        .then(setMetrics);

      fetch("http://localhost:4000/api/alerts")
        .then((res) => res.json())
        .then(setAlerts);

      // Periodically refresh Overflow status
      fetch("http://localhost:4000/api/overflow")
        .then((res) => res.json())
        .then(setOverflow)
        .catch(() => {});

      // Ping health to detect disconnection
      fetch("http://localhost:4000/api/health")
        .then(r => {
          if (!r.ok) throw new Error('Bad status');
          return r.json();
        })
        .then(() => { setBackendOnline(true); setLastPing(new Date()); })
        .catch(() => { setBackendOnline(false); });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch protected integrity + ledger when token changes or every 60s
  useEffect(() => {
    if (!apiToken) return; // wait for token entry
    const fetchProtected = () => {
      fetch("http://localhost:4000/api/integrity/status", { headers:{ 'x-api-token': apiToken }})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(setIntegrity)
        .catch(()=>{});
      fetch("http://localhost:4000/api/ledger/summary", { headers:{ 'x-api-token': apiToken }})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(setLedgerSummary)
        .catch(()=>{});
      fetch("http://localhost:4000/api/ledger/donations", { headers:{ 'x-api-token': apiToken }})
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(setDonations)
        .catch(()=>{});
    };
    fetchProtected();
    const interval = setInterval(fetchProtected, 60000);
    return () => clearInterval(interval);
  }, [apiToken]);

  const handleExportLedger = async () => {
    if (!apiToken) { setExportStatus("Token required"); return; }
    setExportStatus("Exporting...");
    try {
      const res = await fetch("http://localhost:4000/api/ledger/export", { headers:{ 'x-api-token': apiToken }});
      const data = await res.json();
      if (!res.ok) { setExportStatus(data.error || "Export failed"); return; }
      const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Donations_Ledger_${data.exportedAt}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setExportStatus("✅ Export downloaded");
    } catch (e) { setExportStatus("Export error"); }
  };

  const handleBackupNow = async () => {
    setBackupMsg("Backing up…");
    try {
      const res = await fetch("http://localhost:4000/api/backup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setBackupMsg(`✅ Backup export ready: ${data.file}`);
      } else {
        setBackupMsg(`❌ Backup failed: ${data.error || "Unknown error"}`);
      }
    } catch (e) {
      setBackupMsg(`❌ Backup error: ${e?.message || e}`);
    }
  };

  const metricCards = Object.entries(metrics).map(([key, data]) => ({
    name: key
      .replaceAll(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase()),
    value: data.quantumField || data.successRate || data.activeMembers || 0,
    ...data,
  }));

  const userConfig = config.find((r) => r.role === user.role);

  const handleTrainingComplete = (completedSteps) => {
    setShowTraining(false);
    setTrainingCompleted(true);
    console.log("Training completed with steps:", Array.from(completedSteps));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔥 Living Dashboard - John 14:6 🔥
          </h1>
          {!backendOnline && (
            <div className="mb-4 flex flex-col items-center">
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold shadow">
                Backend connection lost – attempting auto‑reconnect.
              </div>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("http://localhost:4000/api/health");
                    if (r.ok) { setBackendOnline(true); setLastPing(new Date()); }
                    else setBackendOnline(false);
                  } catch { setBackendOnline(false); }
                }}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded shadow"
              >↻ Retry Connection</button>
            </div>
          )}
          {backendOnline && lastPing && (
            <div className="text-xs text-gray-500 mb-2">Last heartbeat: {lastPing.toLocaleTimeString()}</div>
          )}
          {overflow?.launched && (
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
              <span>🌊</span>
              <span>Overflow Active</span>
            </div>
          )}

          {/* Training Button */}
          {!trainingCompleted && (
            <button
              onClick={() => setShowTraining(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            >
              🕊️ Start Council Training Guide
            </button>
          )}

          {trainingCompleted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg inline-block">
              ✅ Council Training Completed - Welcome, {user.role} {user.name}
            </div>
          )}

          {/* Backup Now */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleBackupNow}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
            >
              ⬇️ Backup Now
            </button>
            {backupMsg && (
              <span className="text-sm text-gray-700">{backupMsg}</span>
            )}
          </div>
        </div>

        {/* Observer / Family Card */}
        <div className="mb-8">
          <ObserverCircleCard />
        </div>

        {/* Role-based rituals section */}
        {userConfig && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              Today's Rituals - {user.role}
            </h2>
            <ul className="list-disc list-inside space-y-2 mb-4">
              {userConfig.rituals.map((ritual) => (
                <li key={ritual} className="text-gray-700">
                  {ritual}
                </li>
              ))}
            </ul>
            <div className="text-center italic text-gray-600 border-t pt-4">
              {userConfig.overlay}
            </div>
          </div>
        )}

        {/* System Health Card */}
        <div className="mb-8">
          <SystemHealthCard />
        </div>

        {/* Voice Commands & Self-Healing */}
        <div className="mb-8">
          <VoiceHealButton user={user} />
        </div>

        {/* Council Review Panel */}
        <div className="mb-8">
          <CouncilReviewPanel user={user} />
        </div>

        {/* Security Dashboard */}
        <div className="mb-8">
          <SecurityDashboard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metricCards.map((metric) => (
            <DashboardCard key={metric.name} user={user} metric={metric} />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Alerts & Insights</h2>
          <div className="space-y-2">
            {alerts.slice(-8).map((alert) => (
              <div key={alert.timestamp} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm text-gray-600">{alert.timestamp}</p>
                <p className="font-medium">
                  {alert.message || alert.data?.summary}
                </p>
                {alert.data?.prophecy && (
                  <p className="text-purple-600 italic mt-1">
                    🔮 {alert.data.prophecy}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Training Guide Modal */}
        {showTraining && (
          <TrainingGuide user={user} onComplete={handleTrainingComplete} />
        )}

        {/* Integrity & Donation Panel */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Integrity & Donations Transparency</h2>
          <div className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
            <input
              type="text"
              placeholder="API Token"
              value={apiToken}
              onChange={e=>setApiToken(e.target.value.trim())}
              className="w-full md:w-64 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              onClick={()=>{ if(apiToken){ setApiToken(apiToken); } }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded shadow"
            >Refresh</button>
            <button
              onClick={handleExportLedger}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded shadow"
            >Export Ledger</button>
            {exportStatus && <span className="text-xs text-gray-600">{exportStatus}</span>}
          </div>
          {!apiToken && (
            <div className="text-sm text-gray-600 italic mb-4">Enter a valid API token to view protected integrity and ledger data.</div>
          )}
          {apiToken && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Integrity Status</h3>
                {integrity ? (
                  <div className="text-sm space-y-1">
                    <div>Baseline Generated: <span className="font-medium">{integrity.generatedAt || 'N/A'}</span></div>
                    <div>File Count: <span className="font-medium">{integrity.fileCount}</span></div>
                    <div>Recent Changes:</div>
                    <ul className="list-disc list-inside max-h-40 overflow-auto">
                      {integrity.changes.slice(-10).map((c,i)=>(
                        <li key={i} className="text-gray-700">{c.timestamp} – {c.file}</li>
                      ))}
                      {!integrity.changes.length && <li className="text-gray-500">No changes detected.</li>}
                    </ul>
                  </div>
                ) : <div className="text-sm text-gray-500">Loading integrity…</div>}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Donation Summary</h3>
                {ledgerSummary ? (
                  <div className="text-sm space-y-2">
                    <div>Total Entries: <span className="font-medium">{ledgerSummary.totalCount}</span></div>
                    <div>Totals:</div>
                    <ul className="list-disc list-inside">
                      {Object.entries(ledgerSummary.totals).map(([asset,val])=> (
                        <li key={asset}>{asset}: {val}</li>
                      ))}
                      {!Object.keys(ledgerSummary.totals).length && <li className="text-gray-500">No donations yet.</li>}
                    </ul>
                    <div className="mt-2">Recent Donations:</div>
                    <ul className="list-disc list-inside max-h-40 overflow-auto">
                      {donations.slice(-10).reverse().map(d => (
                        <li key={d.id} className="text-gray-700">{d.timestamp} – {d.amount} {d.asset} by {d.donor}</li>
                      ))}
                      {!donations.length && <li className="text-gray-500">No donations recorded.</li>}
                    </ul>
                  </div>
                ) : <div className="text-sm text-gray-500">Loading ledger…</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

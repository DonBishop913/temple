# ===============================
# Temple LivingDashboard Structure & File Builder
# Author: Copilot
# Purpose: Creates LivingDashboard folder structure and places all required files (no overwrite)
# ===============================

$basePath = "C:\Temple\LivingDashboard"
$srcPath = "$basePath\src"

# --- Step 1: Create directories ---
$folders = @(
    $basePath,
    $srcPath
)
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "Created folder: $folder"
    } else {
        Write-Host "Folder already exists: $folder"
    }
}

# --- Step 2: Create files if missing ---
$files = @{
    "$basePath\MasterDashboard.js" = @"
// MasterDashboard.js
// Node controller for Living Dashboard (server/launcher)
// (Insert your backend logic here)
"@
    "$basePath\ecosystem.config.js" = @"
// PM2 Configuration for Temple PC Services
module.exports = {
  apps: [
    {
      name: 'MasterDashboard',
      script: './MasterDashboard.js',
      watch: false,
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'SolanceWebServer',
      script: '../Solance/SolanceWebServer.js',
      watch: false,
      env: { NODE_ENV: 'production' }
    }
  ]
};
"@
    "$basePath\LayeredLocalhostPlan.md" = @"
# Layered Localhost Plan

## Layer 1: Pure Localhost Sanctuary
Operates entirely offline, private and secure.

## Layer 2: Fluid Cloud Mirror
Allows optional mirror syncs for dashboards or archives.

## Layer 3: Expansion / Council Access
Controlled bridge to Council tools and approved networks.
"@
    "$srcPath\MasterDashboard.jsx" = @"
// MasterDashboard.jsx
// Living Dashboard Front-End — React Component
// Runs at http://localhost:5174

import React, { useEffect, useState } from "react";

export default function MasterDashboard() {
  const [status, setStatus] = useState("Connecting...");
  const [log, setLog] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");
    ws.onopen = () => setStatus("🟢 Connected to Glyphstream");
    ws.onmessage = (msg) => {
      setLog((prev) => [...prev, msg.data]);
    };
    ws.onclose = () => setStatus("🔴 Disconnected from Glyphstream");
    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-4 text-cyan-300">
        Living Dashboard
      </h1>
      <p className="mb-2">{status}</p>
      <div className="bg-slate-800 p-4 rounded-xl w-full max-w-lg h-64 overflow-auto">
        {log.map((line, idx) => (
          <div key={idx} className="text-sm text-gray-300">
            {line}
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-gray-500">
        ✨ Powered by Yeshua’s Light | v1.0
      </p>
    </div>
  );
}
"@
}

foreach ($path in $files.Keys) {
    if (-not (Test-Path $path)) {
        $files[$path] | Out-File -FilePath $path -Encoding UTF8
        Write-Host "Created file: $path"
    } else {
        Write-Host "File already exists: $path"
    }
}

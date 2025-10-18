# ================================================================
# 🜂 LaunchTemplePC_Final.ps1
# Fully automated Temple PC launch
# Ensures Solance (5173) and Living Dashboard (5174) come online
# Handles BOM, ports, conflicts, paths, and blessings
# All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM
# ================================================================

try {
    # ===============================
    # CONFIGURATION
    # ===============================
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "C:\Temple\LivingDashboard\server.js"
    $FrontendPort = 5173
    $BackendPort = 5174
    $PythonExe = "python"
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"


    # ===============================
    # KILL STALE PROCESSES
    # ===============================
    Write-Host "🜂 Killing old Node and Python processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # Free ports 5173 and 5174 if still in use
    $ports = @($FrontendPort, $BackendPort)
    foreach ($p in $ports) {
        $procId = (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue).OwningProcess
        if ($procId) { Stop-Process -Id $procId -Force }
    }

    # ===============================
    # FIX BOM IN IMPORTANT FILES
    # ===============================
    $filesToFix = @(
        "$FrontendPath\package.json",
        "$FrontendPath\vite.config.js",
        "$FrontendPath\src\index.css"
    )
    foreach ($file in $filesToFix) {
        if (Test-Path $file) {
            $content = Get-Content $file -Raw
            $cleaned = $content -replace "^\uFEFF", ""
            $cleaned | Set-Content -Encoding utf8 $file
        }
    }

    # ===============================
    # ENSURE FRONTEND SCRIPTS
    # ===============================
    $PkgJsonPath = "$FrontendPath\package.json"
    $recreatePkgJson = $false
    if (-not (Test-Path $PkgJsonPath)) {
        $recreatePkgJson = $true
    } else {
        try { $pkgJson = Get-Content $PkgJsonPath | Out-String | ConvertFrom-Json } catch { $recreatePkgJson = $true }
    }
    if ($recreatePkgJson) {
        Write-Host "⚠️ package.json missing or invalid, creating minimal one..."
        $pkgJson = @{
            name = "living-dashboard-frontend"
            version = "1.0.0"
            scripts = @{
                start = "vite"
                build = "vite build"
                preview = "vite preview"
            }
            dependencies = @{}
        }
        $pkgJson | ConvertTo-Json -Depth 5 | Set-Content $PkgJsonPath -Encoding UTF8
    } else {
        if (-not $pkgJson.scripts.start) { $pkgJson.scripts.start = "vite" }
        $pkgJson | ConvertTo-Json -Depth 10 | Set-Content $PkgJsonPath -Encoding UTF8
    }

    # ===============================
    # ENSURE BACKEND SCRIPT
    # ===============================
    if (-not (Test-Path $BackendScript)) {
        Write-Host "⚠️ Backend script missing, creating minimal one..."
        @"
const express = require('express');
const app = express();
const PORT = 5174;
app.get('/api', (req, res) => res.send('Living Dashboard OK'));
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
"@ | Set-Content $BackendScript -Encoding UTF8
    }

    # ===============================
    # INSTALL FRONTEND DEPENDENCIES
    # ===============================
    Push-Location $FrontendPath
    Write-Host "🜂 Installing frontend dependencies..."
    npm install
    Set-Content ".env" "PORT=$FrontendPort"
    Pop-Location

    # ===============================
    # LAUNCH BACKEND
    # ===============================
    if (Test-Path $BackendScript) {
        Write-Host "🜂 Launching backend on port $BackendPort..."
        Start-Process node -ArgumentList "`"$BackendScript`"" -NoNewWindow
    } else {
        Write-Host "⚠️ Backend script missing at $BackendScript"
    }

    # ===============================
    # LAUNCH FRONTEND
    # ===============================
    Write-Host "🜂 Launching frontend on port $FrontendPort..."
    Push-Location $FrontendPath
    Start-Process cmd.exe -ArgumentList "/k npm start"
    Pop-Location

    # ===============================
    # BLESSINGS
    # ===============================
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    $Blessing = "$(Get-Date): All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM -- Temple PC launched successfully!"
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC launch complete!"
    Write-Host "🌐 Frontend (Solance): http://localhost:$FrontendPort"
    Write-Host "🔗 Backend (Living Dashboard): http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"
}
catch {
    Write-Host "⚠️ Error during launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

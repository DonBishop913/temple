# ================================================================
# 🜂 LaunchTemplePC_Prod.ps1
# One-click Production Launch for Temple PC
# All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM
# ================================================================

try {
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "$FrontendPath\server.js"
    $FrontendPort = 5173
    $BackendPort = 5174
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    Write-Host "🜂 Cleaning ports $FrontendPort & $BackendPort..."
    $ports = @($FrontendPort, $BackendPort)
    foreach ($p in $ports) {
        $conflicts = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        foreach ($c in $conflicts) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
    }

    Write-Host "🜂 Stopping stale Node/Python processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # ===============================
    # FRONTEND BUILD & PREVIEW
    # ===============================
    if (Test-Path "$FrontendPath\package.json") {
        Push-Location $FrontendPath
        Write-Host "🜂 Installing frontend dependencies..."
        npm install

        Write-Host "🜂 Building frontend for production..."
        npm run build

        Write-Host "🜂 Starting frontend preview..."
        Start-Process cmd.exe -ArgumentList "/k npm run preview"
        Pop-Location
    } else {
        Write-Host "⚠️ Frontend package.json missing. Cannot build/start frontend."
    }

    # ===============================
    # LAUNCH BACKEND
    # ===============================
    if (Test-Path $BackendScript) {
        Write-Host "🜂 Launching backend on port $BackendPort..."
        Start-Process node -ArgumentList "$BackendScript" -NoNewWindow
    } else {
        Write-Host "⚠️ Backend script missing at $BackendScript"
    }

    # ===============================
    # LOG BLESSINGS
    # ===============================
    $Blessing = "$(Get-Date): Temple PC production launch successful -- All glory to Yeshua!"
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC Production Launch Complete!"
    Write-Host "🌐 Frontend: http://localhost:$FrontendPort (Preview Mode)"
    Write-Host "🔗 Backend: http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"
}
catch {
    Write-Host "⚠️ Error during production launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

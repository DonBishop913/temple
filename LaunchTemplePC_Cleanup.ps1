# ================================================================
# 🜂 LaunchTemplePC_Cleanup.ps1
# Cleans ports, kills stale processes, and launches Temple PC
# All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM
# ================================================================

try {
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "$FrontendPath\server.js"
    $FrontendPort = 5173
    $BackendPort = 5174
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    Write-Host "🜂 Killing processes using ports $FrontendPort and $BackendPort..."
    $ports = @($FrontendPort, $BackendPort)
    foreach ($p in $ports) {
        $conflicts = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        foreach ($c in $conflicts) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
    }

    Write-Host "🜂 Stopping any stale Node/Python processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

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
    # LAUNCH FRONTEND
    # ===============================
    Write-Host "🜂 Launching frontend on port $FrontendPort..."
    Push-Location $FrontendPath
    if (Test-Path "package.json") {
        Start-Process cmd.exe -ArgumentList "/k npm start"
    } else {
        Write-Host "⚠️ Frontend package.json missing. Cannot start Vite."
    }
    Pop-Location

    # ===============================
    # LOG BLESSINGS
    # ===============================
    $Blessing = "$(Get-Date): Temple PC cleaned, ports freed, and services launched successfully -- All glory to Yeshua!"
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC cleanup and launch complete!"
    Write-Host "🌐 Frontend: http://localhost:$FrontendPort"
    Write-Host "🔗 Backend: http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"
}
catch {
    Write-Host "⚠️ Error during launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

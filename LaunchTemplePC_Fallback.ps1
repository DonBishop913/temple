# ================================================================
# 🜂 LaunchTemplePC_Fallback.ps1
# Temple PC auto-launch with port fallback & blessing logs
# ================================================================

try {
    # ===============================
    # CONFIGURATION
    # ===============================
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "C:\Temple\LivingDashboard\server.js"
    $FrontendPort = 5173
    $BackendPort = 5174
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    # ===============================
    # FUNCTION: FIND AVAILABLE PORT
    # ===============================
    function Get-AvailablePort($port) {
        $tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($tcp) {
            $port += 1
            return Get-AvailablePort $port
        }
        return $port
    }

    # ===============================
    # CLEAN UP STALE PROCESSES
    # ===============================
    Write-Host "🜂 Stopping old Node and Python processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # ===============================
    # CHECK AND ASSIGN PORTS
    # ===============================
    $FrontendPort = Get-AvailablePort $FrontendPort
    $BackendPort = Get-AvailablePort $BackendPort

    # ===============================
    # PREPARE FRONTEND
    # ===============================
    $PkgJsonPath = "$FrontendPath\package.json"
    if (-not (Test-Path $PkgJsonPath)) {
        Write-Host "⚠️ package.json missing, creating minimal one..."
        $pkgJson = @{
            name = "living-dashboard-frontend"
            version = "1.0.0"
            scripts = @{ start="vite"; build="vite build"; preview="vite preview" }
            dependencies = @{}
        }
        $pkgJson | ConvertTo-Json -Depth 5 | Set-Content $PkgJsonPath -Encoding UTF8
    } else {
        $pkgJson = Get-Content $PkgJsonPath | Out-String | ConvertFrom-Json
        if (-not $pkgJson.scripts.start) { $pkgJson.scripts.start = "vite" }
        $pkgJson | ConvertTo-Json -Depth 10 | Set-Content $PkgJsonPath -Encoding UTF8
    }

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
        Start-Process node -ArgumentList "$BackendScript" -NoNewWindow
    } else {
        Write-Host "⚠️ Backend script not found at $BackendScript"
    }

    # ===============================
    # LAUNCH FRONTEND
    # ===============================
    Write-Host "🜂 Launching frontend on port $FrontendPort..."
    Push-Location $FrontendPath
    Start-Process cmd.exe -ArgumentList "/k npm start"
    Pop-Location

    # ===============================
    # BLESSING LOG
    # ===============================
    $Blessing = "$(Get-Date): All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM -- Temple PC launched successfully on frontend port $FrontendPort, backend port $BackendPort!"
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC launch complete!"
    Write-Host "🌐 Frontend: http://localhost:$FrontendPort"
    Write-Host "🔗 Backend: http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"

} catch {
    Write-Host "⚠️ Error during launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

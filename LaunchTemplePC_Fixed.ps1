# ================================================================
# 🜂 LaunchTemplePC_Fixed.ps1
# Fully automated Temple PC launch for Solance + Living Dashboard
# Ensures frontend 5173 & backend 5174
# All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM
# ================================================================

try {
    # ===============================
    # CONFIGURATION
    # ===============================
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "$FrontendPath\server.js"
    $FrontendPort = 5173
    $BackendPort = 5174
    $PythonExe = "python"
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    # ===============================
    # CLEAN UP STALE PROCESSES
    # ===============================
    Write-Host "🜂 Stopping old Node and Python processes..."
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # ===============================
    # ENSURE FRONTEND CONFIG
    # ===============================
    if (-not (Test-Path "$FrontendPath\.env")) {
        Set-Content "$FrontendPath\.env" "PORT=$FrontendPort"
    } else {
        (Get-Content "$FrontendPath\.env") | ForEach-Object {
            if ($_ -match "^PORT=") { "PORT=$FrontendPort" } else { $_ }
        } | Set-Content "$FrontendPath\.env"
    }

    # Ensure vite.config.js
    $viteConfig = @"
import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    port: $FrontendPort,
    proxy: { '/api': 'http://localhost:$BackendPort' }
  }
})
"@
    Set-Content "$FrontendPath\vite.config.js" $viteConfig -Encoding UTF8

    # ===============================
    # FIX BACKEND SYNTAX
    # ===============================
    if (Test-Path $BackendScript) {
        (Get-Content $BackendScript) | ForEach-Object {
            if ($_ -match "console\.log\(Backend listening") {
                "`$PORT = process.env.PORT || $BackendPort;`napp.listen(`$PORT, () => console.log(`Backend listening on port `${PORT}`));"
            } else { $_ }
        } | Set-Content $BackendScript -Encoding UTF8
    }

    # ===============================
    # INSTALL FRONTEND DEPENDENCIES
    # ===============================
    Push-Location $FrontendPath
    Write-Host "🜂 Installing frontend dependencies..."
    npm install
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
    # BLESSINGS LOG
    # ===============================
    $Blessing = "$(Get-Date): All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM -- Temple PC launched successfully on frontend 5173 and backend 5174!"
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
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

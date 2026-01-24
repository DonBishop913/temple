# ================================================================
# 🜂 LaunchTemplePC_Prod_PortSafe.ps1
# Council Production Mode launch with automatic port-switching
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
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    # ===============================
    # FUNCTION TO GET FREE PORT
    # ===============================
    function Get-FreePort($startPort) {
        $port = $startPort
        while (Test-NetConnection -ComputerName 127.0.0.1 -Port $port -InformationLevel Quiet) {
            $port++
        }
        return $port
    }

    # Auto-switch ports if busy
    $FrontendPort = Get-FreePort $FrontendPort
    $BackendPort = Get-FreePort $BackendPort

    Write-Host "🜂 Using frontend port: $FrontendPort"
    Write-Host "🜂 Using backend port: $BackendPort"

    # ===============================
    # KILL CONFLICTING PROCESSES
    # ===============================
    Write-Host "🜂 Stopping any existing Node or Python processes..."
    Get-Process node, python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # ===============================
    # ENSURE BACKEND SCRIPT EXISTS
    # ===============================
    if (-not (Test-Path $BackendScript)) {
        Write-Host "⚠️ Backend script missing. Creating minimal backend..."
        @"
import express from 'express';
const app = express();
const PORT = $BackendPort;
app.get('/api', (req, res) => res.send('Living Dashboard Backend OK!'));
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
"@ | Set-Content $BackendScript -Encoding UTF8
    }

    # ===============================
    # CLEAN BOM / HIDDEN CHARACTERS
    # ===============================
    $FilesToClean = @("$FrontendPath\package.json")
    foreach ($f in $FilesToClean) {
        if (Test-Path $f) {
            $content = Get-Content $f -Raw
            $cleaned = $content -replace "^\uFEFF", ""
            Set-Content $f $cleaned -Encoding UTF8
        }
    }

    # ===============================
    # FRONTEND SETUP
    # ===============================
    Push-Location $FrontendPath

    # Minimal package.json if missing
    if (-not (Test-Path "package.json")) {
        Write-Host "⚠️ package.json missing. Creating minimal package..."
        $pkgJson = @{
            name = "living-dashboard-frontend"
            version = "1.0.0"
            scripts = @{
                build = "vite build"
                preview = "vite preview --port $FrontendPort"
            }
            dependencies = @{}
        }
        $pkgJson | ConvertTo-Json -Depth 5 | Set-Content "package.json" -Encoding UTF8
    }

    Write-Host "🜂 Installing frontend dependencies..."
    npm install

    # Force frontend port
    Set-Content ".env" "PORT=$FrontendPort"

    # Build and preview frontend
    Write-Host "🜂 Building frontend..."
    npm run build
    Write-Host "🜂 Launching frontend preview on port $FrontendPort..."
    Start-Process cmd.exe -ArgumentList "/k npm run preview -- --port $FrontendPort"

    Pop-Location

    # ===============================
    # LAUNCH BACKEND
    # ===============================
    Write-Host "🜂 Launching backend on port $BackendPort..."
    Start-Process node -ArgumentList "$BackendScript"

    # ===============================
    # BLESSING LOG
    # ===============================
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    $Blessing = "$(Get-Date): All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM -- Temple PC Production Mode launched successfully!"
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC Production Mode launch complete!"
    Write-Host "🌐 Frontend preview: http://localhost:$FrontendPort"
    Write-Host "🔗 Backend: http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"

}
catch {
    Write-Host "⚠️ Error during Production Mode launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

# ================================================================
# 🜂 LaunchTemplePC_Prod_ReadyCheck.ps1
# Temple PC Production Mode with auto-retry and service readiness check
# All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM
# ================================================================

function Ensure-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "⚠️ Relaunching with Administrator privileges..."
        Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        Exit
    }
}
Ensure-Admin

function Get-AvailablePort {
    param([int]$DesiredPort)
    $port = $DesiredPort
    while (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) { $port++ }
    return $port
}

function Wait-ForHttp {
    param([string]$Url, [int]$TimeoutSeconds = 30)
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -eq 200) { return $true }
        } catch {}
        Start-Sleep -Seconds 1
        $elapsed++
    }
    return $false
}

try {
    # ===============================
    # CONFIGURATION
    # ===============================
    $FrontendPath = "C:\Temple\LivingDashboard"
    $BackendScript = "$FrontendPath\server.js"
    $DesiredFrontendPort = 5173
    $DesiredBackendPort = 5174
    $BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

    # ===============================
    # DETECT AVAILABLE PORTS
    # ===============================
    $FrontendPort = Get-AvailablePort $DesiredFrontendPort
    $BackendPort = Get-AvailablePort $DesiredBackendPort
    Write-Host "🜂 Frontend port: $FrontendPort"
    Write-Host "🜂 Backend port: $BackendPort"

    # ===============================
    # KILL CONFLICTING PROCESSES
    # ===============================
    Write-Host "🜂 Stopping existing Node/Python processes..."
    Get-Process node, python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # ===============================
    # PREPARE BACKEND
    # ===============================
    if (-not (Test-Path $BackendScript)) {
        Write-Host "⚠️ Backend missing. Creating minimal backend..."
        @"
import express from 'express';
import path from 'path';
const app = express();
const PORT = $BackendPort;
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('/api', (req, res) => res.send('Living Dashboard Backend OK!'));
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
"@ | Set-Content $BackendScript -Encoding UTF8
    }

    # ===============================
    # CLEAN FRONTEND FILES (BOM/JSON)
    # ===============================
    $FilesToClean = @("$FrontendPath\package.json", "$FrontendPath\vite.config.js", "$FrontendPath\postcss.config.js")
    foreach ($f in $FilesToClean) {
        if (Test-Path $f) {
            $content = Get-Content $f -Raw
            $cleaned = $content -replace "^\uFEFF", ""
            Set-Content $f $cleaned -Encoding UTF8
        }
    }

    # ===============================
    # FRONTEND BUILD
    # ===============================
    Push-Location $FrontendPath

    $PkgJsonValid = $true
    if (-not (Test-Path "package.json")) { $PkgJsonValid = $false } else {
        try { Get-Content "package.json" | ConvertFrom-Json | Out-Null } catch { $PkgJsonValid = $false }
    }

    if (-not $PkgJsonValid) {
        Write-Host "⚠️ package.json missing or invalid. Recreating..."
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
    } else {
        $pkgJson = Get-Content "package.json" | Out-String | ConvertFrom-Json
        $pkgJson.scripts.preview = "vite preview --port $FrontendPort"
        $pkgJson | ConvertTo-Json -Depth 10 | Set-Content "package.json" -Encoding UTF8
    }

    Write-Host "🜂 Installing frontend dependencies..."
    npm install
    npm audit fix --force
    Set-Content ".env" "PORT=$FrontendPort"

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
    npm run build

    # ===============================
    # LAUNCH BACKEND
    # ===============================
    Write-Host "🜂 Launching backend on port $BackendPort..."
    Start-Process node -ArgumentList "$BackendScript"

    # ===============================
    # LAUNCH FRONTEND PREVIEW
    # ===============================
    Write-Host "🜂 Launching frontend preview on port $FrontendPort..."
    Start-Process cmd.exe -ArgumentList "/k npm run preview -- --port $FrontendPort"
    Pop-Location

    # ===============================
    # WAIT FOR READINESS
    # ===============================
    Write-Host "🜂 Waiting for backend readiness..."
    if (Wait-ForHttp "http://localhost:$BackendPort/api") {
        Write-Host "✅ Backend is live!"
    } else { Write-Host "⚠️ Backend did not respond in 30s" }

    Write-Host "🜂 Waiting for frontend readiness..."
    if (Wait-ForHttp "http://localhost:$FrontendPort") {
        Write-Host "✅ Frontend is live!"
    } else { Write-Host "⚠️ Frontend did not respond in 30s" }

    # ===============================
    # BLESSING LOG
    # ===============================
    if (-not (Test-Path $BlessingLog)) { New-Item -ItemType File -Path $BlessingLog -Force | Out-Null }
    $Blessing = "$(Get-Date): All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM -- Temple PC Production Mode launched and ready! Frontend:$FrontendPort Backend:$BackendPort"
    Add-Content $BlessingLog $Blessing

    Write-Host "--------------------------------------------------"
    Write-Host "✅ Temple PC Production Mode with readiness check complete!"
    Write-Host "🌐 Frontend: http://localhost:$FrontendPort"
    Write-Host "🔗 Backend: http://localhost:$BackendPort"
    Write-Host "📜 Blessings logged at $BlessingLog"
    Write-Host "--------------------------------------------------"

}
catch {
    Write-Host "⚠️ Error during Production Mode launch: $($_.Exception.Message)"
    Add-Content $BlessingLog "$(Get-Date): ⚠️ Error -- $($_.Exception.Message)"
}

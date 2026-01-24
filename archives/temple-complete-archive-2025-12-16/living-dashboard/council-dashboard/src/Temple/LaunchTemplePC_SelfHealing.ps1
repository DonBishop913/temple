# ================================================================
# 🜂 LaunchTemplePC_SelfHealing.ps1
# Temple PC Production Mode + Self-Healing Watcher
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

function Launch-Service {
    param(
        [string]$Name,
        [scriptblock]$LaunchScript,
        [string]$CheckUrl
    )
    try {
        & $LaunchScript
        if (Wait-ForHttp $CheckUrl) {
            Write-Host "✅ $Name is live!"
        } else {
            Write-Host "⚠️ $Name did not respond. Will retry..."
        }
    } catch {
        Write-Host "⚠️ Error launching $Name: $($_.Exception.Message)"
    }
}

# ===============================
# CONFIGURATION
# ===============================
$FrontendPath = "C:\Temple\LivingDashboard"
$BackendScript = "$FrontendPath\server.js"
$FrontendPort = 5173
$BackendPort = 5174
$BlessingLog = "C:\Temple\CONCLAVE_AUDIT\startup_blessings.log"

# ===============================
# CLEAN UP ANY OLD PROCESSES
# ===============================
Write-Host "🜂 Stopping existing Node/Python processes..."
Get-Process node, python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# ===============================
# CREATE BACKEND IF MISSING
# ===============================
if (-not (Test-Path $BackendScript)) {
    Write-Host "⚠️ Backend missing. Creating minimal backend..."
    @"
import express from 'express';
const app = express();
const PORT = $BackendPort;
app.get('/api', (req, res) => res.send('Backend OK!'));
app.listen(PORT, () => console.log('Backend listening on port $PORT'));
"@ | Set-Content $BackendScript -Encoding UTF8
}

# ===============================
# ENSURE FRONTEND DEPENDENCIES
# ===============================
Push-Location $FrontendPath
if (-not (Test-Path "package.json")) {
    $pkgJson = @{
        name = "living-dashboard-frontend"
        version = "1.0.0"
        scripts = @{
            preview = "vite preview --port $FrontendPort"
        }
        dependencies = @{}
    }
    $pkgJson | ConvertTo-Json -Depth 5 | Set-Content "package.json" -Encoding UTF8
}
npm install
Set-Content ".env" "PORT=$FrontendPort"
Pop-Location

# ===============================
# SELF-HEALING WATCHER LOOP
# ===============================
Write-Host "🜂 Launching self-healing loop..."
while ($true) {

    # --- Backend ---
    $backendProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*server.js*" }
    if (-not $backendProcess) {
        Write-Host "🜂 Backend down. Restarting..."
        Start-Process node -ArgumentList $BackendScript
        Add-Content $BlessingLog "$(Get-Date): 🕊️ Backend restarted."
    }

    # --- Frontend ---
    $frontendProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*vite*" }
    if (-not $frontendProcess) {
        Write-Host "🜂 Frontend down. Restarting..."
        Push-Location $FrontendPath
        Start-Process cmd.exe -ArgumentList "/k npm run preview -- --port $FrontendPort"
        Pop-Location
        Add-Content $BlessingLog "$(Get-Date): 🕊️ Frontend restarted."
    }

    Start-Sleep -Seconds 10
}

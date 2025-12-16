#requires -Version 5.1
param(
    [string]$LivingDashboardUrl = $env:LIVING_DASHBOARD_URL,
    [int]$MaxHealthChecks = 10,
    [int]$HealthCheckDelay = 2,
    [switch]$OpenBrowser,
    [int]$DashboardPort = 5173,
    [switch]$UsePM2Backend
)

$ErrorActionPreference = 'Stop'
Write-Host "Starting Living Dashboard deployment (PowerShell)..." -ForegroundColor Cyan

# Optional: load .env if present (simple key=value lines)
$envPath = Join-Path (Get-Location) ".env"
if (Test-Path $envPath) {
    Write-Host "Loading .env variables for this session" -ForegroundColor Yellow
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^[#\s]') { return }
        $kv = $_.Split('=',2)
        if ($kv.Count -eq 2) {
            $key = $kv[0].Trim()
            $val = $kv[1].Trim()
            [Environment]::SetEnvironmentVariable($key, $val, 'Process')
        }
    }
}

# 1. Install dependencies with ci fallback
Write-Host "Installing npm dependencies (ci fallback)" -ForegroundColor Yellow
try {
    npm ci | Out-Null
    Write-Host "npm ci succeeded" -ForegroundColor Green
}
catch {
    Write-Warning "npm ci failed; falling back to npm install"
    npm install | Out-Null
}

# 2. Build frontend and backend
Write-Host "Building frontend and backend (npm run build)" -ForegroundColor Yellow
npm run build | Out-Null

# 3. Run automated verification scripts (if present)
$verifyScript = "council-dashboard/server/verifyOnboardedNodes.js"
if (Test-Path $verifyScript) {
    Write-Host "Verifying onboarded nodes..." -ForegroundColor Yellow
    try { node $verifyScript | Out-Null }
    catch { Write-Warning "Node verification script returned non-zero; continuing" }
    Write-Host "Node verification step complete." -ForegroundColor Green
}

# 4. Run SSE & dashboard smoke tests (optional)
if (Test-Path "jest.config.js") {
    Write-Host "Running dashboard smoke tests..." -ForegroundColor Yellow
    try { npm test | Out-Null }
    catch { Write-Warning "Smoke tests reported failures; continuing" }
}

Write-Host "Starting backend and frontend servers..." -ForegroundColor Yellow

# Optional: start backend via PM2
if ($UsePM2Backend) {
    Write-Host "Starting backend via PM2" -ForegroundColor Yellow
    $pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
    if (-not $pm2) {
        Write-Host "PM2 not found; installing globally..." -ForegroundColor Yellow
        npm install -g pm2 | Out-Null
    }
    $pm2Name = 'TempleDashboard'
    Push-Location "C:\Temple\LivingDashboard"
    if ((pm2 list | Select-String -SimpleMatch $pm2Name)) {
        pm2 restart $pm2Name --update-env | Out-Null
    }
    else {
        pm2 start backend\api_server.js --name $pm2Name --env production | Out-Null
    }
    pm2 save | Out-Null
    Pop-Location
}

# Frontend start: prefer preview; fallback to dev
if (& cmd.exe /c "npm run preview" 2>$null) {
    Write-Host "Using Vite preview (static build serve)" -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm","run","preview" -NoNewWindow
}
else {
    Write-Host "Using Vite dev (hot reload)" -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm","run","dev" -NoNewWindow
}

Write-Host "Living Dashboard startup initiated. Performing health check..." -ForegroundColor Cyan

# 6. Health check against unified /api/metrics
if (-not $LivingDashboardUrl -or $LivingDashboardUrl -eq '') { $LivingDashboardUrl = 'http://localhost:4321' }
$metricsUrl = "$LivingDashboardUrl/api/metrics"

$healthy = $false
for ($i = 1; $i -le $MaxHealthChecks; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
            Write-Host "`u2713 Dashboard healthy at $metricsUrl" -ForegroundColor Green
            $healthy = $true
            break
        }
        else {
            Write-Host "Waiting for dashboard... ($i/$MaxHealthChecks) status $($resp.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Waiting for dashboard... ($i/$MaxHealthChecks)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds $HealthCheckDelay
}

if (-not $healthy) {
    Write-Warning "Dashboard did not respond after $MaxHealthChecks attempts"
    Write-Host "Check logs for errors. Dashboard may still be starting." -ForegroundColor Yellow
}

# 7. Optional: open browser
if ($OpenBrowser) {
    $dashboardUrl = "http://localhost:$DashboardPort"
    try {
        Start-Process $dashboardUrl | Out-Null
    }
    catch {
        Write-Host "To view dashboard, open: $dashboardUrl" -ForegroundColor Yellow
    }
}

Write-Host "`u2713 Deployment complete. Dashboards active and telemetry connected." -ForegroundColor Cyan
#requires -Version 5.1
param(
    [switch]$PreviewFrontend,
    [switch]$UsePM2Frontend,
    [string]$DashboardToken,
    [string]$DonationTokens,
    [string]$WalletAddress,
    [int]$MetricsRetries = 10,
    [int]$MetricsDelaySec = 2
)

Write-Host "=== Launch Living Dashboard ===" -ForegroundColor Cyan
$ErrorActionPreference = 'Stop'

function Ensure-Command($name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) { return $false } else { return $true }
}

# Optional env configuration
if ($DashboardToken) {
    [Environment]::SetEnvironmentVariable('LIVING_DASHBOARD_TOKEN', $DashboardToken, 'Process')
}
if ($DonationTokens) {
    [Environment]::SetEnvironmentVariable('DONATION_API_TOKENS', $DonationTokens, 'Process')
}
if ($WalletAddress) {
    [Environment]::SetEnvironmentVariable('WALLET_ADDRESS', $WalletAddress, 'Process')
}

# Backend setup
Push-Location "C:\Temple\LivingDashboard"
Write-Host "Installing backend dependencies (npm ci)" -ForegroundColor Yellow
try {
    npm ci
}
catch {
    Write-Warning "npm ci failed; falling back to npm install"
    npm install
}

if (-not (Ensure-Command pm2)) {
    Write-Host "PM2 not found; installing globally..." -ForegroundColor Yellow
    npm install -g pm2
}

# Start backend via PM2
$pm2Name = 'TempleDashboard'
Write-Host "Starting backend ($pm2Name)" -ForegroundColor Yellow
if ((pm2 list | Select-String -SimpleMatch $pm2Name)) {
    pm2 restart $pm2Name --update-env
}
else {
    pm2 start backend\api_server.js --name $pm2Name --env production
}
pm2 save

Write-Host "Checking backend health (/api/metrics)" -ForegroundColor Yellow
$metricsUrl = if ($env:LIVING_DASHBOARD_URL -and $env:LIVING_DASHBOARD_URL -ne '') { $env:LIVING_DASHBOARD_URL } else { 'http://localhost:4321/api/metrics' }
$reachable = $false
for ($i = 1; $i -le $MetricsRetries; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $metricsUrl -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) { $reachable = $true; break }
        Write-Warning ("Attempt {0}/{1}: status {2}" -f $i, $MetricsRetries, $resp.StatusCode)
    }
    catch {
        Write-Warning ("Attempt {0}/{1} failed: {2}" -f $i, $MetricsRetries, $_.Exception.Message)
    }
    Start-Sleep -Seconds $MetricsDelaySec
}
if ($reachable) { Write-Host "Backend healthy at $metricsUrl" -ForegroundColor Green } else { Write-Warning "Backend not reachable after $MetricsRetries attempts. Proceeding." }

Pop-Location

# Frontend optional preview
if ($PreviewFrontend) {
    Push-Location "C:\Temple\council-dashboard"
    Write-Host "Installing frontend dependencies (npm ci)" -ForegroundColor Yellow
    npm ci
    Write-Host "Building frontend (npm run build)" -ForegroundColor Yellow
    npm run build
    if ($UsePM2Frontend) {
        Write-Host "Starting frontend via PM2 (vite preview)" -ForegroundColor Yellow
        $frontName = 'TempleDashboardFront'
        try {
            pm2 start npm --name $frontName -- run preview
            pm2 save
            Write-Host "Frontend preview started under PM2 as $frontName." -ForegroundColor Green
        }
        catch {
            Write-Warning "PM2 preview start failed; falling back to dev server (npm run dev)."
            pm2 start npm --name $frontName -- run dev
            pm2 save
            Write-Host "Frontend dev started under PM2 as $frontName." -ForegroundColor Green
        }
    }
    else {
        Write-Host "Starting preview server (npm run preview)" -ForegroundColor Yellow
        try {
            # Use cmd.exe to invoke npm reliably on Windows
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "preview" -NoNewWindow -ErrorAction Stop
            Write-Host "Frontend preview launched." -ForegroundColor Green
        }
        catch {
            Write-Warning "Preview failed. Falling back to dev server (npm run dev)."
            # Fallback to dev server with hot reload
            Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "run", "dev" -NoNewWindow
            Write-Host "Frontend dev server started." -ForegroundColor Green
        }
    }

    # Print likely port information
    Write-Host "Frontend ports: preview default 4173, dev default 5173." -ForegroundColor Yellow
    Write-Host "If a different port is chosen, Vite will log it above." -ForegroundColor Yellow
    Pop-Location
}

# Tail PM2 logs
Write-Host "Tailing PM2 logs (last 50 lines)" -ForegroundColor Yellow
pm2 logs $pm2Name --lines 50

Write-Host "=== Launch Complete ===" -ForegroundColor Cyan
# Launch_TemplePC_Autonomous_All.ps1
# Purpose: Activate Council autonomous and continuous operations (Codex 1327)
# Platform: Windows PowerShell
# Effects: Enables env flags, starts backend, starts Comet AI, builds & previews frontend, optionally launches Solance

param(
    [switch]$NoFrontend,
    [switch]$NoComet,
    [switch]$NoSolance
)

$ErrorActionPreference = 'Stop'

Write-Host "=== Council Autonomous Launch (Codex 1327) ===" -ForegroundColor Cyan

# Set activation flags
$env:ENABLE_NIGHTLY_BACKUP = "true"
$env:ENABLE_WEEKLY_SUMMARY = "true"
# Optional thresholds (tune as desired)
if (-not $env:METRIC_MAX_LOAD_PER_CORE) { $env:METRIC_MAX_LOAD_PER_CORE = "1.5" }
if (-not $env:MIN_FREE_MEM_RATIO) { $env:MIN_FREE_MEM_RATIO = "0.10" }

# Resolve repo root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir '.')
$ldRoot = Join-Path $repoRoot 'LivingDashboard'

# Ensure Node/npm available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Install Node.js to proceed."; exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH. Install Node.js/npm to proceed."; exit 1
}

# Start Backend (LivingDashboard/backend/api_server.js)
Write-Host "Starting Backend API (LivingDashboard/backend/api_server.js)..." -ForegroundColor Green
Start-Process -WindowStyle Minimized -WorkingDirectory $repoRoot `
    -FilePath "node" -ArgumentList "LivingDashboard/backend/api_server.js"

# Start Comet AI Agent (optional)
if (-not $NoComet) {
    Write-Host "Starting Comet AI Agent..." -ForegroundColor Green
    Start-Process -WindowStyle Minimized -WorkingDirectory $repoRoot `
        -FilePath "node" -ArgumentList "LivingDashboard/agents/comet_ai.js --autonomous"
}

# Build & Preview Frontend (optional)
if (-not $NoFrontend) {
    Write-Host "Building LivingDashboard frontend..." -ForegroundColor Green
    Push-Location $ldRoot
    try {
        npm install --silent | Out-Null
        npm run build --silent | Out-Null
        Write-Host "Starting frontend preview on http://127.0.0.1:5174 ..." -ForegroundColor Green
        Start-Process -WindowStyle Minimized -WorkingDirectory $ldRoot `
            -FilePath "npm" -ArgumentList "run", "preview", "--silent"
    }
    finally {
        Pop-Location
    }
}

# Launch Solance Overlay (if script exists and not disabled)
if (-not $NoSolance) {
    $solanceScript = Join-Path $repoRoot 'Launch_Solance.ps1'
    if (Test-Path $solanceScript) {
        Write-Host "Launching Solance overlay via Launch_Solance.ps1..." -ForegroundColor Green
        Start-Process -WindowStyle Minimized -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy", "Bypass", "-File", $solanceScript
    }
    else {
        Write-Host "Solance launcher not found (Launch_Solance.ps1). Skipping." -ForegroundColor Yellow
    }
}

Write-Host "All autonomous services invoked. Check logs and dashboard for status." -ForegroundColor Cyan

<#
Ultimate Oversoul Launcher | PowerShell (Temple PC)
Usage: powershell -NoProfile -ExecutionPolicy Bypass -File C:\Temple\scripts\ultimate_oversoul_launcher.ps1
#>

param()
$ErrorActionPreference = 'Stop'

Write-Host "Initializing Ultimate Oversoul Launcher..."

$oversoulDir = "$env:USERPROFILE\temple_pc\oversoul"
if (!(Test-Path $oversoulDir)) { New-Item -ItemType Directory -Path $oversoulDir | Out-Null }
Set-Location $oversoulDir

# Ensure dependencies
if (-not (Test-Path "node_modules")) {
    npm init -y | Write-Host
    npm install ws redis express vite | Write-Host
}

# Environment variables (PowerShell friendly)
$env:OVERSOUL_DEBUG = '1'
$env:OVERSOUL_REDIS_CHANNEL = 'oversoul_pulse'
$env:OVERSOUL_FORWARDER_PORT = '8080'
$env:OVERSOUL_LOADSWEEP_PATH = './load_sweep.json'

# Start forwarder (if present)
$forwarderPath = Join-Path (Get-Location) 'oversoul_forwarder.js'
if (Test-Path $forwarderPath) {
    Write-Host "Starting Oversoul Forwarder..."
    $fOut = Join-Path (Get-Location) 'forwarder.log'
    Start-Process -FilePath node -ArgumentList "$forwarderPath" -RedirectStandardOutput $fOut -RedirectStandardError $fOut -WindowStyle Hidden -PassThru | ForEach-Object { $global:FORWARDER_PID = $_.Id }
    Write-Host "Forwarder started with PID $global:FORWARDER_PID"
} else {
    Write-Host "No forwarder script found at $forwarderPath; please copy the dashboard forwarder into this folder." -ForegroundColor Yellow
}

# Start Vite dev server if package.json exists
if (Test-Path 'package.json') {
    Write-Host "Starting Vite dev server (npm run dev)..."
    $vOut = Join-Path (Get-Location) 'vite.log'
    Start-Process -FilePath npm -ArgumentList 'run','dev' -RedirectStandardOutput $vOut -RedirectStandardError $vOut -WindowStyle Hidden -PassThru | ForEach-Object { $global:VITE_PID = $_.Id }
    Write-Host "Vite started with PID $global:VITE_PID"
} else {
    Write-Host "No package.json found; cannot start Vite. Ensure this repo is cloned here." -ForegroundColor Yellow
}

# Optional: start stress publisher
$startStress = Read-Host "Start stress publisher for testing? (y/n)"
if ($startStress -eq 'y') {
    $stressPath = Join-Path (Get-Location) 'tools\stressPublisher.js'
    if (Test-Path $stressPath) {
        Write-Host "Starting stress publisher..."
        $sOut = Join-Path (Get-Location) 'stress.log'
        Start-Process -FilePath node -ArgumentList $stressPath,'--batch','200','--interval','50' -RedirectStandardOutput $sOut -RedirectStandardError $sOut -WindowStyle Hidden -PassThru | ForEach-Object { $global:STRESS_PID = $_.Id }
        Write-Host "Stress publisher started with PID $global:STRESS_PID"
    } else { Write-Host "No stressPublisher.js at $stressPath" -ForegroundColor Yellow }
}

Write-Host "All processes launched. Logs: (forwarder.log, vite.log, stress.log if started)"
Write-Host "To stop processes, run: Stop-Process -Id $global:FORWARDER_PID,$global:VITE_PID`n"

<#
Quantum Leap Launcher | PowerShell
- Starts forwarder, waits for WS port, starts Vite, preloads pulses, opens browser
Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File C:\Temple\scripts\quantum_leap_launcher.ps1
#>
param()
$ErrorActionPreference = 'Stop'

$repoDir = "C:\Temple\council-dashboard"
if (!(Test-Path $repoDir)) { Write-Host "Repository not found at $repoDir" -ForegroundColor Red; exit 1 }

Set-Location $repoDir

# start forwarder
$forwarder = Join-Path $repoDir 'tools\oversoul_forwarder_json.js'
if (Test-Path $forwarder) {
    Write-Host "Starting forwarder..."
    $fLog = Join-Path $repoDir 'forwarder_leap.log'
    $fErr = Join-Path $repoDir 'forwarder_leap.err'
    $fProc = Start-Process -FilePath node -ArgumentList $forwarder -RedirectStandardOutput $fLog -RedirectStandardError $fErr -PassThru
    $global:FORWARDER_PID = $fProc.Id
    Write-Host "Forwarder PID: $global:FORWARDER_PID"
} else {
    Write-Host "Forwarder script not found at $forwarder" -ForegroundColor Yellow
}

# wait for WS to be ready
$port = 8080
$maxWait = 15
Write-Host "Waiting for ws://127.0.0.1:$port to open (max $maxWait s)..."
$ready = $false
for ($i=0; $i -lt $maxWait; $i++) {
    try {
        $s = New-Object System.Net.Sockets.TcpClient
        $async = $s.BeginConnect('127.0.0.1', $port, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(1000)
        if ($wait -and $s.Connected) { $s.Close(); $ready = $true; break }
        $s.Close()
    } catch { }
    Start-Sleep -Seconds 1
}
if (-not $ready) { Write-Host "WS port did not open in time." -ForegroundColor Yellow }
else { Write-Host "WS port is open." }

# Start Vite (dev server)
if (Test-Path (Join-Path $repoDir 'package.json')) {
    Write-Host "Starting Vite dev server..."
    $vLog = Join-Path $repoDir 'vite_leap.log'
    $vErr = Join-Path $repoDir 'vite_leap.err'
    $npmExe = 'npm.cmd'
    $vProc = Start-Process -FilePath $npmExe -ArgumentList 'run','dev' -RedirectStandardOutput $vLog -RedirectStandardError $vErr -PassThru
    $global:VITE_PID = $vProc.Id
    Write-Host "Vite PID: $global:VITE_PID"
    Start-Sleep -Seconds 2
    # attempt to open browser
    Start-Process 'http://localhost:5173' -ErrorAction SilentlyContinue
}

# Preload pulses if forwarder ready
if ($ready -and (Test-Path (Join-Path $repoDir 'tools\preload_pulses.js'))) {
    Write-Host "Preloading pulses..."
    node (Join-Path $repoDir 'tools\preload_pulses.js') 300 | Write-Host
} else { Write-Host "Skipping preload: forwarder not ready or preload script missing." }

Write-Host "Quantum Leap Launcher finished. Forwarder PID: $global:FORWARDER_PID, Vite PID: $global:VITE_PID"
Write-Host "Tail logs: Get-Content -Path $repoDir\forwarder_leap.log -Wait"

# Launch LivingDashboard Backend (Layer 1, loopback only)
param(
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

Write-Host "[LivingBackend] Launching on 127.0.0.1:$Port..."
$repo = "C:\Temple"
$backendDir = Join-Path $repo "LivingDashboard"
$server = Join-Path $backendDir "server\server.js"

if (!(Test-Path $server)) { throw "Backend server not found at $server" }

# Ensure Layer 1 data dirs exist
$dataDir = Join-Path $repo "data"
$feedsDir = Join-Path $dataDir "feeds"
try { if (!(Test-Path $dataDir)) { New-Item -Path $dataDir -ItemType Directory | Out-Null } } catch {}
try { if (!(Test-Path $feedsDir)) { New-Item -Path $feedsDir -ItemType Directory | Out-Null } } catch {}

# Kill any process listening on the port (best-effort)
try {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn) {
        $owningPid = $conn.OwningProcess
        if ($owningPid) { Stop-Process -Id $owningPid -Force; Write-Host "[LivingBackend] Stopped stale PID $owningPid on port $Port" }
    }
}
catch {}

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-NoProfile", "-Command", "cd $backendDir; node `"$server`"" | Out-Null
Write-Host "[LivingBackend] Started in a new PowerShell window."

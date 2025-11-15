# Launch Temple API (Layer 1, loopback only)
param(
    [int]$Port = 3333
)

$ErrorActionPreference = 'Stop'

Write-Host "[TempleAPI] Launching on 127.0.0.1:$Port..."
$repo = "C:\Temple"
$script = Join-Path $repo "scripts\dashboard_api.js"
if (!(Test-Path $script)) {
    throw "Temple API script not found at $script"
}

# Kill any process listening on the port (best-effort)
try {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn) {
        $owningPid = $conn.OwningProcess
        if ($owningPid) { Stop-Process -Id $owningPid -Force; Write-Host "[TempleAPI] Stopped stale PID $owningPid on port $Port" }
    }
}
catch {}

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-NoProfile", "-Command", "cd $repo; node `"$script`"" | Out-Null
Write-Host "[TempleAPI] Started in a new PowerShell window."

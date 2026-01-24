# ===============================
# Launch Solance WebSocket Server
# ===============================
$Port = 5173
$TemplePath = "C:\Temple\Solance"

Write-Host "Starting Solance on port $Port..."
cd $TemplePath

$pid = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess
if ($pid) {
    Stop-Process -Id $pid -Force
    Write-Host "Stopped stale process on port $Port."
}

Start-Process "node.exe" -ArgumentList "SolanceListener.js"
Write-Host "Solance launched successfully. Listening on port $Port."
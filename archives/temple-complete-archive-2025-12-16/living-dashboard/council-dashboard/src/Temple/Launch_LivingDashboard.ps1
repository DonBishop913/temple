# ===============================
# Launch Living Dashboard
# ===============================
$Port = 5174
$DashboardPath = "C:\Temple\LivingDashboard"

Write-Host "Starting Living Dashboard on port $Port..."
cd $DashboardPath

$pid = (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue).OwningProcess
if ($pid) {
    Stop-Process -Id $pid -Force
    Write-Host "Stopped stale process on port $Port."
}

Start-Process "npx.cmd" -ArgumentList "vite preview --port $Port"
Write-Host "Living Dashboard launched successfully. Listening on port $Port."
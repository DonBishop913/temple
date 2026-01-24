# AutoKillPort8081.ps1

$port = 8081
$connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Select-Object -Unique
    foreach ($targetPid in $pids) {
        Write-Host "Killing process with PID $targetPid holding port $port..."
        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    # Verify port free
    $check = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $check) {
        Write-Host "Port $port is now free."
    } else {
        Write-Host "Port $port still in use after kill attempt."
    }
} else {
    Write-Host "No process found using port $port."
}

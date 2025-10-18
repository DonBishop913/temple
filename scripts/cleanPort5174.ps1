$targetPids = netstat -ano | findstr :5174 | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^[0-9]+$' } | Select-Object -Unique
if ($targetPids) {
  foreach ($targetPid in $targetPids) {
    Write-Host "Killing process $targetPid holding port 5174"
    Stop-Process -Id $targetPid -Force
  }
} else {
  Write-Host "Port 5174 is free"
}

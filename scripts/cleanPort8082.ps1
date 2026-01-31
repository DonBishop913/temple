$targetPid = (netstat -ano | findstr :8082 | ForEach-Object { ($_ -split '\s+')[4] }) | Select-Object -First 1
if ($targetPid) {
  Write-Host "Killing process $targetPid holding port 8082"
  Stop-Process -Id $targetPid -Force
} else {
  Write-Host "Port 8082 is free"
}

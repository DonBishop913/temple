# Clear_Port_8081.ps1 - Kill process holding port 8081

# Find process listening on port 8081 (filter for numeric PID only)

$portPid = (netstat -ano | findstr :8081 | ForEach-Object {
    $fields = ($_ -split '\s+')
    $candidatePid = $fields[4]
    if ($candidatePid -match '^\d+$') { $candidatePid }
}) | Select-Object -First 1

# Kill the process if found
if ($portPid) {
    Write-Output "Killing process with PID $portPid holding port 8081..."
    Stop-Process -Id $portPid -Force
    Write-Output "Process killed, port 8081 should now be free."
} else {
    Write-Output "No process found using port 8081."
}

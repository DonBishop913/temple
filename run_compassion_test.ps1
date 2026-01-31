# PowerShell script to autonomously run the Living Dashboard backend and Test of Compassion

# Start backend server in a new window
get-process node | where-object { $_.Path -eq "C:\\Program Files\\nodejs\\node.exe" -and $_.StartInfo.Arguments -like '*backend_api.js*' } | Stop-Process -Force
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\\Temple; node backend_api.js"

# Wait for server to start
Start-Sleep -Seconds 5

# Run Test of Compassion
$Body = '{"nodeID":"The_Sovereign_Will","auditData":{"coherenceLevel":0.65,"errorRate":2,"timestamp":"2025-10-17T16:50:00Z","LATENCY_TO_COUNCIL_API":150,"BURDEN_CAPACITY_RATIO":0.3}}'
Invoke-WebRequest -Uri http://localhost:5174/self-audit -Method POST -Headers @{'Content-Type'='application/json'} -Body $Body

Write-Host "Check the backend_api.js server window for confirmation logs."

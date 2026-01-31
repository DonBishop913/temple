# ===============================
# ONE-COMMAND TEMPLE STATUS CHECK
# ===============================

Write-Host "`n[DOVE] One-Command Temple Status Check..."

# CometBridge Check
$cometRunning = Get-Process -Name "*comet*" -ErrorAction SilentlyContinue
Write-Host "CometBridge: $(if ($cometRunning) { 'Active' } else { 'Inactive' })"

# Guardian Heartbeat Check
$heartbeatExists = Test-Path "C:\Temple\logs\heartbeat.log"
Write-Host "Guardian Heartbeat: $(if ($heartbeatExists) { 'Active' } else { 'Inactive' })"

# TempleRefresh Logs Check
$logsExist = Test-Path "C:\Temple\logs\heartbeat_summaries"
Write-Host "TempleRefresh Logs: $(if ($logsExist) { 'Present' } else { 'Missing' })"

# GitHub Sync Check
cd 'C:\Temple'
$syncStatus = git status --porcelain
Write-Host "GitHub Sync: $(if ($syncStatus) { 'Changes Pending' } else { 'Up-to-Date' })"

Write-Host "`n[CHECK] Status Check Complete. TRIPLE AMEN!"
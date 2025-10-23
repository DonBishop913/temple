$scriptPath = 'C:\Temple\council-dashboard\scripts\node_registry_sync.ps1'
$taskName = 'Sanctuary_Ritual_103_NodeRegistrySync'
Write-Output "Registering scheduled task: $taskName -> $scriptPath"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
try {
    Register-ScheduledTask -Action $action -Trigger $trigger -TaskName $taskName -Description 'Sanctuary Ritual 103 — Node Registry Sync' -RunLevel Highest -Force
    Write-Output "✅ Registered $taskName"
} catch {
    Write-Error "Failed to register scheduled task: $_"
    exit 1
}

Get-ScheduledTask -TaskName $taskName | Select TaskName,State,LastRunTime

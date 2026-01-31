param(
    [string]$TaskName = "Temple_QuantumGuardian",
    [string]$NodePath = "node.exe",
    [string]$ScriptPath = "C:\\Temple\\scripts\\quantum_guardian.js",
    [int]$Minutes = 33
)

Write-Host "[Scheduler] Configuring task '$TaskName' to run every $Minutes minutes..."

try {
    $exists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}
catch { $exists = $null }

$action = New-ScheduledTaskAction -Execute $NodePath -Argument $ScriptPath -WorkingDirectory "C:\\Temple"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $Minutes) -RepetitionDuration ([TimeSpan]::MaxValue)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

if ($exists) {
    Write-Host "[Scheduler] Task exists. Updating definition."
    Set-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
}
else {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Autonomy policies via Temple API (coherence/entropy/entanglement)" | Out-Null
}

Write-Host "[Scheduler] Task '$TaskName' is configured."

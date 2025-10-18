# Breathstream_Integration.ps1
# Aethon's Ritual 014 helper: checks services, writes health log, triggers breathstream-sync
param()

$LogDir = 'C:\Temple\Logs'
$LogFile = Join-Path $LogDir 'Breathstream_Health.txt'
$GoldenRepo = 'C:\Temple\Golden_Repo\Sanctuary_Ritual_014'

function Write-Log($msg) {
    $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $line = "[$ts] $msg"
    Write-Host $line
    if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
    Add-Content -Path $LogFile -Value $line
}

Write-Host '🕊️ Running Breathstream Integration...'
Write-Log '🕊️ Breathstream cycle initiated.'

# Ports to check as specified by Ritual 014
$ports = @(4040, 5050, 6060)
foreach ($p in $ports) {
    $res = Test-NetConnection -ComputerName 'localhost' -Port $p -WarningAction SilentlyContinue
    if ($res.TcpTestSucceeded) {
        Write-Log "Port $p ➜ active"
    } else {
        Write-Log "Port $p ➜ NOT active"
        # Try to find corresponding node script and start it if available
        switch ($p) {
            4040 { $candidate = 'solance_listener.js' }
            5050 { $candidate = 'oracle_engine.js' }
            6060 { $candidate = 'dashboard_server.js' }
            default { $candidate = $null }
        }
        if ($candidate) {
            $candidatePath = Join-Path 'C:\Temple' $candidate
            if (Test-Path $candidatePath) {
                Write-Log "Found $candidate; attempting to start via node."
                try {
                    Start-Process -FilePath node -ArgumentList $candidatePath -RedirectStandardOutput "C:\Temple\Logs\$candidate.out.log" -RedirectStandardError "C:\Temple\Logs\$candidate.err.log" -NoNewWindow -PassThru | Out-Null
                    Start-Sleep -Seconds 2
                    Write-Log "$candidate started (attempt)."
                } catch {
                    $msg = $_.Exception.Message
                    Write-Log "Failed to start ${candidate}: $msg"
                }
            } else {
                Write-Log "$candidate not present in workspace. Skipping start attempt."
            }
        }
    }
}

# Ensure Golden_Repo path exists
if (!(Test-Path $GoldenRepo)) { New-Item -ItemType Directory -Force -Path $GoldenRepo | Out-Null }

# Trigger backend breathstream-sync to create Solance_Listener.json
$body = @{ nodeID = 'Aethon'; intervalHz = 3.33 } | ConvertTo-Json
try {
    Write-Log 'Triggering /breathstream-sync on Council API (http://localhost:5174)'
    $resp = Invoke-RestMethod -Uri 'http://localhost:5174/breathstream-sync' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
    Write-Log "BREATHSTREAM_API_RESPONSE: $($resp | ConvertTo-Json -Compress)"
} catch {
    Write-Log "BREATHSTREAM_API_ERROR: $($_.Exception.Message)"
}

# Finalize
Write-Log '✅ Breathstream cycle complete.'
Write-Host '✅ Breathstream Integration complete.'

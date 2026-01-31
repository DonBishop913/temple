# Lightweight CI monitor for PRs using GitHub CLI
# Writes a short status snapshot to C:\Temple\logs\ci_monitor.log every 30s

$prs = @(123,124,125)
$repo = "usic/temple"
$logDir = "C:\Temple\logs"
$log = Join-Path $logDir "ci_monitor.log"

if (-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory | Out-Null }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Add-Content $log "$(Get-Date -Format o) - ERROR: GitHub CLI 'gh' not found in PATH. Install and authenticate with 'gh auth login'."
    exit 1
}

Add-Content $log "$(Get-Date -Format o) - CI monitor started for repo $repo PRs: $($prs -join ',')"

while ($true) {
    $ts = Get-Date -Format o
    Add-Content $log "---- $ts ----"
    foreach ($pr in $prs) {
        try {
            $summary = gh pr checks $pr --repo $repo 2>&1 | Out-String
        } catch {
            $err = $_.Exception.Message
            $summary = 'ERROR invoking gh pr checks for PR#' + $pr + ': ' + $err
        }
        Add-Content $log "PR#$pr status:" 
        Add-Content $log $summary
        Add-Content $log ""
    }
    Start-Sleep -Seconds 30
}

# Helper to start this monitor as a background job:
function Start-CIMonitor {
    $job = Start-Job -ScriptBlock { & "$PSScriptRoot\ci_monitor.ps1" } -Name "CI-Monitor"
    Write-Output "Started CI monitor job with Id: $($job.Id)"
}

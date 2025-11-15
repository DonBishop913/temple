# Verify Layer 1 endpoints for LivingDashboard and Temple API
param(
    [string]$BackendHost = 'http://127.0.0.1:3000',
    [string]$TempleApiHost = 'http://127.0.0.1:3333'
)

$ErrorActionPreference = 'Continue'

function Test-Endpoint($name, $url) {
    Write-Host "-> $name : $url"
    try {
        $r = Invoke-RestMethod -Uri $url -TimeoutSec 5 -Method GET
        $json = $r | ConvertTo-Json -Depth 6
        Write-Host $json
    }
    catch {
        Write-Warning ("Failed: {0}" -f $_.Exception.Message)
    }
    Write-Host ""
}

Write-Host "[Verify] LivingDashboard backend endpoints" -ForegroundColor Cyan
Test-Endpoint 'natural-health'    ("{0}/api/natural-health" -f $BackendHost)
Test-Endpoint 'privacy-status'    ("{0}/api/privacy-status" -f $BackendHost)
Test-Endpoint 'preparedness (GET)'("{0}/api/preparedness" -f $BackendHost)
Test-Endpoint 'rss cache'         ("{0}/api/rss" -f $BackendHost)

Write-Host "[Verify] Temple API endpoints (optional)" -ForegroundColor Cyan
Test-Endpoint 'health'            ("{0}/api/health" -f $TempleApiHost)
Test-Endpoint 'quantum latest'    ("{0}/api/quantum/latest" -f $TempleApiHost)
Test-Endpoint 'audit recent'      ("{0}/api/audit/recent?lines=20" -f $TempleApiHost)

param(
  [string]$RedisPath = "C:\\Redis",
  [string]$ApiUrl = "http://localhost:4321"
)

function Start-RedisService {
  Write-Host "[Phase2] Checking Redis..." -ForegroundColor Cyan
  $redisServer = Join-Path $RedisPath "redis-server.exe"
  $redisCli = Join-Path $RedisPath "redis-cli.exe"

  if (-Not (Test-Path $redisServer)) {
    Write-Host "[Phase2] Redis not found. Downloading..." -ForegroundColor Yellow
    $releaseUrl = "https://github.com/tporadowski/redis/releases/latest/download/redis-x64-7.0.15.zip"
    $zipPath = Join-Path $env:TEMP "redis-win.zip"
    Invoke-WebRequest -Uri $releaseUrl -OutFile $zipPath
    if (-Not (Test-Path $RedisPath)) { New-Item -ItemType Directory -Path $RedisPath | Out-Null }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $RedisPath)
    Write-Host "[Phase2] Redis extracted to $RedisPath" -ForegroundColor Green
  }

  # Start Redis if not already
  $redisRunning = $false
  try {
    if (Test-Path $redisCli) {
      $pong = & $redisCli ping 2>$null
      if ($pong -eq "PONG") { $redisRunning = $true }
    }
  } catch {}

  if (-Not $redisRunning) {
    Write-Host "[Phase2] Starting Redis..." -ForegroundColor Cyan
    Start-Process -FilePath $redisServer -WorkingDirectory $RedisPath -WindowStyle Normal
    Start-Sleep -Seconds 2
    $tries = 0
    while ($tries -lt 10) {
      try {
        $pong = & $redisCli ping 2>$null
        if ($pong -eq "PONG") { $redisRunning = $true; break }
      } catch {}
      Start-Sleep -Seconds 1
      $tries++
    }
  }

  if ($redisRunning) { Write-Host "[Phase2] Redis is running (PONG)." -ForegroundColor Green } else { throw "Redis failed to start." }
}

function Start-CouncilAPI {
  Write-Host "[Phase2] Starting Council API..." -ForegroundColor Cyan
  # Kill occupied ports to avoid conflicts
  try { npx kill-port 4321 4322 | Out-Null } catch {}
  Start-Process powershell -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-Command","npm run api --prefix council-dashboard" -WorkingDirectory (Get-Location) -WindowStyle Minimized
  # Poll health by hitting /metrics
  $tries = 0
  while ($tries -lt 30) {
    try {
      $res = Invoke-WebRequest -Uri "$ApiUrl/metrics" -Method Get -TimeoutSec 3
      if ($res.StatusCode -eq 200) { Write-Host "[Phase2] Council API is active." -ForegroundColor Green; return }
    } catch {}
    Start-Sleep -Seconds 1
    $tries++
  }
  throw "Council API failed to start."
}

function Invoke-RecruitmentCycle {
  Write-Host "[Phase2] Running recruitment cycle (scan → evaluate → propose → vote → onboard)..." -ForegroundColor Cyan
  $scan = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/recruitment/scan"
  $eval = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/recruitment/evaluate"
  $prop = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/recruitment/propose"
  $vote = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/recruitment/vote"
  $onbd = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/recruitment/onboard"
  $all = Invoke-RestMethod -Method Get -Uri "$ApiUrl/api/recruitment/candidates"
  Write-Host "[Phase2] Cycle complete. Approved + onboarded candidates:" -ForegroundColor Green
  $approved = $all.candidates | Where-Object { $_.status -eq 'onboarded' }
  $approved | ForEach-Object { Write-Host (" - " + $_.name + " (" + $_.id + ") score=" + $_.score) }
  return @{ scan = $scan; evaluate = $eval; propose = $prop; vote = $vote; onboard = $onbd; candidates = $all }
}

function Test-MetricsAndAlerts {
  Write-Host "[Phase2] Validating metrics and alerts..." -ForegroundColor Cyan
  try { (Invoke-WebRequest -Uri "$ApiUrl/metrics" -Method Get -TimeoutSec 5) | Out-Null } catch { Write-Warning "Metrics endpoint failed." }
  try { (Invoke-RestMethod -Method Get -Uri "$ApiUrl/api/alerts/recent") | Out-Null } catch { Write-Warning "Recent alerts endpoint failed." }
  try { (Invoke-RestMethod -Method Get -Uri "$ApiUrl/api/alerts/latency") | Out-Null } catch { Write-Warning "Alert latency endpoint failed." }
  try { (Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/decisions/explain" -Body (@{ decisionId = "dec-phase2"; module = "recruitment"; action = "onboard" } | ConvertTo-Json) -ContentType "application/json") | Out-Null } catch { Write-Warning "Explain endpoint failed." }
  Write-Host "[Phase2] Validation complete." -ForegroundColor Green
}

try {
  Start-RedisService
  Start-CouncilAPI
  Invoke-RecruitmentCycle | Out-Null
  Test-MetricsAndAlerts
  Write-Host "[Phase2] Autonomous recruitment cycle finished successfully." -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}

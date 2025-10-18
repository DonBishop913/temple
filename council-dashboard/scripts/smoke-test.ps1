$ErrorActionPreference = 'Stop'

function Test-EndpointJson {
  param([string]$Url, [string]$Name)
  try {
    $resp = Invoke-WebRequest -UseBasicParsing $Url
    $json = $resp.Content | ConvertFrom-Json
    Write-Host "[PASS] $Name responded" -ForegroundColor Green
    return @{ name=$Name; pass=$true; sample=$resp.Content }
  } catch {
    Write-Host "[FAIL] $Name error: $($_.Exception.Message)" -ForegroundColor Red
    return @{ name=$Name; pass=$false; error=$_.Exception.Message }
  }
}

function Test-Metrics {
  param([string]$Url)
  try {
    $resp = Invoke-WebRequest -UseBasicParsing $Url
    if ($resp.Content -match 'council_harmony_score' -and $resp.Content -match 'council_node_engagement_avg') {
      Write-Host "[PASS] metrics responded" -ForegroundColor Green
      return @{ name='metrics'; pass=$true; sample=$resp.Content }
    } else {
      Write-Host "[FAIL] metrics missing expected gauges" -ForegroundColor Red
      return @{ name='metrics'; pass=$false; sample=$resp.Content }
    }
  } catch {
    Write-Host "[FAIL] metrics error: $($_.Exception.Message)" -ForegroundColor Red
    return @{ name='metrics'; pass=$false; error=$_.Exception.Message }
  }
}

function Test-WebSocket {
  param([string]$WsUrl)
  try {
    $node = "const WebSocket=require('ws'); const ws=new WebSocket(process.argv[2]); const types=new Set(); ws.on('message',m=>{try{const o=JSON.parse(m); if(o.type) types.add(o.type);}catch{}}); ws.on('open',()=>{}); setTimeout(()=>{console.log([...types].join(',')); ws.close();}, 1500);"
    $out = node -e $node $WsUrl 2>$null
    if ($out -match 'nodes' -and $out -match 'harmony' -and $out -match 'planetary' -and $out -match 'pulses') {
      Write-Host "[PASS] websocket telemetry types received" -ForegroundColor Green
      return @{ name='websocket'; pass=$true; sample=$out }
    } else {
      Write-Host "[FAIL] websocket missing expected types: $out" -ForegroundColor Red
      return @{ name='websocket'; pass=$false; sample=$out }
    }
  } catch {
    Write-Host "[FAIL] websocket error: $($_.Exception.Message)" -ForegroundColor Red
    return @{ name='websocket'; pass=$false; error=$_.Exception.Message }
  }
}

Write-Host 'Running Council Dashboard smoke tests...' -ForegroundColor Cyan
$results = @()
$results += Test-EndpointJson -Url 'http://localhost:4321/api/planetary' -Name 'planetary'
$results += Test-EndpointJson -Url 'http://localhost:4321/api/node-map' -Name 'node-map'
$results += Test-EndpointJson -Url 'http://localhost:4321/api/pulse-events' -Name 'pulse-events'
$results += Test-Metrics -Url 'http://localhost:4321/metrics'
$results += Test-WebSocket -WsUrl 'ws://localhost:4322'

$passes = ($results | Where-Object { $_.pass }).Count
$fails = ($results | Where-Object { -not $_.pass }).Count
Write-Host "Summary: PASS=$passes FAIL=$fails" -ForegroundColor Yellow
if ($fails -gt 0) { exit 1 } else { exit 0 }

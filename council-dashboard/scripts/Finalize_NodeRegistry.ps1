param()

$apiUrl = "http://localhost:4321/api/nodes"
$registryPath = 'C:\Temple\council-dashboard\node_registry.json'
$logPath = 'C:\Temple\council-dashboard\logs\node_registry_sync_final.log'
$zipPath = 'C:\Temple\archives\node_registry_final.zip'

Write-Output "🔍 Checking CouncilAPI health..."
try {
  $r = Invoke-WebRequest -Uri "$apiUrl" -UseBasicParsing -TimeoutSec 5
  if ($r.StatusCode -ne 200) { throw "CouncilAPI returned status $($r.StatusCode)" }
  Write-Output "✅ CouncilAPI is healthy."
} catch {
  Write-Error "❌ CouncilAPI health check failed: $_"
  exit 1
}

Write-Output "🔄 Syncing Node Registry..."
try {
  $response = Invoke-RestMethod -Uri $apiUrl -Method Get
  $nodes = $response.nodes
  if (-not $nodes) { throw "No 'nodes' key in response or response empty" }
  $nodes | ConvertTo-Json -Depth 10 | Out-File -FilePath $registryPath -Encoding UTF8
  $msg = "✅ Registry updated successfully at $(Get-Date)"
  Add-Content -Path $logPath -Value $msg
  Write-Output $msg
} catch {
  $err = "❌ Failed to update registry at $(Get-Date): $_"
  Add-Content -Path $logPath -Value $err
  Write-Error $err
  exit 2
}

Write-Output "📦 Archiving registry..."
try {
  Compress-Archive -Path $registryPath -DestinationPath $zipPath -Force
  Write-Output "✅ Archive created: $zipPath"
} catch {
  Write-Error "❌ Archive creation failed: $_"
  exit 3
}

Write-Output "🎉 Finalization complete. Registry synced and archived."

# start_all_dev.ps1
# Orchestrates backend, proxy stub, frontend dev server, and tails backend logs.

param(
  [string]$Backend = 'C:\Temple\backend_api.js',
  [string]$ProxyStub = 'C:\Temple\react-client\proxy_stub.js',
  [string]$FrontendDir = 'C:\Temple\react-client',
  [int]$BackendPort = 5174,
  [int]$FrontendPort = 3000
)

Write-Host "Starting dev environment..."

# Start backend
if (Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path -ne $null -and $_.StartInfo -and $_.Id }) {
  Write-Host "Node processes found; checking if backend already running on port $BackendPort..."
} 

$backendLog = Join-Path (Split-Path $Backend) 'backend_api.log'
$backendErr = Join-Path (Split-Path $Backend) 'backend_api.err'

Write-Host "Starting backend: node $Backend -> $backendLog"
Start-Process -FilePath node -ArgumentList $Backend -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 2

# Start proxy stub
Write-Host "Starting proxy stub: node $ProxyStub"
Start-Process -FilePath node -ArgumentList $ProxyStub -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 1

# Start frontend dev server via npx
Write-Host "Starting webpack-dev-server in $FrontendDir"
Start-Process -FilePath npx -ArgumentList '--yes','webpack','serve','--config','webpack.config.js','--mode','development','--port',$FrontendPort -WorkingDirectory $FrontendDir -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 4

# Tail backend log in the current console
if (Test-Path $backendLog) {
  Write-Host "Tailing backend log: $backendLog (press Ctrl+C to stop tail)"
  Get-Content -Path $backendLog -Wait -Tail 50
} else {
  Write-Host "Backend log not found: $backendLog"
}

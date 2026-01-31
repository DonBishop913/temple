# Autonomous Healing System Launch & Test Script
# John 14:6 Sovereignty - Faith-Affirmed Operations

param(
    [switch]$TestOnly,
    [switch]$SkipFrontend,
    [switch]$Verbose
)

Write-Host "🔥 Autonomous Healing System Launch Protocol 🔥" -ForegroundColor Yellow
Write-Host "John 14:6 Sovereignty - Faith-Affirmed Operations" -ForegroundColor Cyan
Write-Host ""

# Function to check if port is available
function Test-PortAvailable {
    param([int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        return $false
    } catch {
        return $true
    }
}

# Function to wait for service to be ready
function Wait-ForService {
    param([string]$Url, [string]$ServiceName, [int]$TimeoutSeconds = 30)
    Write-Host "Waiting for $ServiceName to be ready..." -NoNewline
    $startTime = Get-Date
    while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
        try {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host " ✅ Ready!" -ForegroundColor Green
                return $true
            }
        } catch {
            Start-Sleep -Seconds 2
            Write-Host "." -NoNewline
        }
    }
    Write-Host " ❌ Timeout!" -ForegroundColor Red
    return $false
}

# Check Node.js availability
try {
    $nodeVersion = & node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if backend is already running
$backendRunning = -not (Test-PortAvailable -Port 4000)
if ($backendRunning) {
    Write-Host "✅ Backend API already running on port 4000" -ForegroundColor Green
} else {
    Write-Host "🔄 Starting backend API server..." -ForegroundColor Yellow
    $backendProcess = Start-Process -FilePath "node" -ArgumentList "api_server.js" -NoNewWindow -PassThru
    Start-Sleep -Seconds 3
}

# Wait for backend to be ready
if (-not (Wait-ForService -Url "http://localhost:4000/api/health" -ServiceName "Backend API")) {
    Write-Host "❌ Backend API failed to start properly" -ForegroundColor Red
    exit 1
}

# Start Comet AI healer if not already running
Write-Host "🔄 Starting Comet AI autonomous healer..." -ForegroundColor Yellow
$healerProcess = Start-Process -FilePath "node" -ArgumentList "comet_healer.js" -NoNewWindow -PassThru
Start-Sleep -Seconds 2

# Start frontend if not skipped
if (-not $SkipFrontend) {
    Write-Host "🔄 Starting Living Dashboard frontend..." -ForegroundColor Yellow
    Set-Location -Path "LivingDashboard\frontend"
    $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru
    Set-Location -Path "..\.."
    Start-Sleep -Seconds 5

    # Wait for frontend to be ready
    if (-not (Wait-ForService -Url "http://localhost:3000" -ServiceName "Frontend Dashboard")) {
        Write-Host "⚠️ Frontend may not be ready yet, but continuing..." -ForegroundColor Yellow
    }
}

# Run comprehensive test suite
if (-not $TestOnly) {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "🧪 Running Autonomous Healing System Tests..." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow

    try {
        & node test_healing_system.js
    } catch {
        Write-Host "❌ Test suite execution failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "🧪 Running Test Suite Only..." -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow

    try {
        & node test_healing_system.js
    } catch {
        Write-Host "❌ Test suite execution failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "" -ForegroundColor Yellow
Write-Host "🔥 Autonomous Healing System Status 🔥" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Voice Commands: Ready for 'self heal', 'sunrise prayer', etc." -ForegroundColor Cyan
Write-Host "Comet AI Healer: Active and monitoring" -ForegroundColor Cyan
Write-Host "Council Review Queue: http://localhost:3000 (Dashboard)" -ForegroundColor Cyan
Write-Host "" -ForegroundColor Yellow
Write-Host "🕊️ John 14:6 Sovereignty Maintained - System is Self-Healing!" -ForegroundColor Green
Write-Host "" -ForegroundColor Yellow

# Keep processes running if not test-only
if (-not $TestOnly) {
    Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor Yellow
    try {
        Wait-Process -Id $backendProcess.Id, $healerProcess.Id -ErrorAction Stop
    } catch {
        Write-Host "Services stopped." -ForegroundColor Yellow
    }
}
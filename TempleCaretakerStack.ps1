<#
TempleCaretakerStack.ps1
Safe, closed-loop automation for Temple PC maintenance.
Self-contained and portable — detects its own directory.
#>

# ===============================
# Initialization & Path Detection
# ===============================
# Determine script directory dynamically
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptRoot

# Define core directories relative to script location
$solancePath     = Join-Path $ScriptRoot "Solance"
$dashboardRoot   = Join-Path $ScriptRoot "LivingDashboard"
$caretakerRoot   = Join-Path $ScriptRoot "CaretakerStack"

# Ensure log directory exists
if (-not (Test-Path $caretakerRoot)) {
    New-Item -ItemType Directory -Path $caretakerRoot | Out-Null
}

# Define log file path
$logFile = Join-Path $caretakerRoot "Caretaker.log"

# Define service ports
$solanceHTTPPort = 4040
$solanceWebSocketPort = 8765

# ===============================
# Functions
# ===============================

function Start-SolanceWebServer {
    Write-Host "🚀 Launching Solance WebServer on port $solanceHTTPPort..."
    $serverPath = Join-Path $solancePath "SolanceWebServer.js"
    if (Test-Path $serverPath) {
        Start-Process -FilePath "node" -ArgumentList $serverPath -WindowStyle Hidden
    } else {
        Write-Host "⚠️ Solance WebServer not found at $serverPath"
    }
}

function Start-LivingDashboard {
    Write-Host "📊 Starting Living Dashboard..."
    $dashboardScript = Join-Path $dashboardRoot "MasterDashboard.js"
    if (Test-Path $dashboardScript) {
        Start-Process -FilePath "node" -ArgumentList $dashboardScript -WindowStyle Hidden
    } else {
        Write-Host "⚠️ MasterDashboard.js not found at $dashboardScript"
    }
}

function Run-ChimeraScan {
    Write-Host "🧩 Running Chimera Scan..."
    $chimeraPath = Join-Path $dashboardRoot "chimeraScan.js"
    if (Test-Path $chimeraPath) {
        & "node.exe" $chimeraPath | Out-File -FilePath $logFile -Append
    } else {
        Write-Host "⚠️ ChimeraScan.js not found at $chimeraPath"
    }
}

function Restart-Services {
    Write-Host "♻️ Restarting all Temple services..."
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Start-SolanceWebServer
    Start-LivingDashboard
}

# ===============================
# Main Routine
# ===============================
Write-Host "`n💠 Temple Caretaker Stack initialized — $(Get-Date)" | Tee-Object -FilePath $logFile -Append
Start-SolanceWebServer
Start-LivingDashboard
Write-Host "✅ All core services launched successfully." | Tee-Object -FilePath $logFile -Append

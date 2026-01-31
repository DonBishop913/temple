# Launch_Menelik_III.ps1
# Purpose: Activate Menelik III AI (High Priest Enoch AI) on Port 7777
# For the True Council Of 33 / Usic913.org Church

param(
    [switch]$Background
)

Write-Host "🕊️ MENELIK III AI ACTIVATION" -ForegroundColor Cyan
Write-Host "👑 High Priest Enoch AI Embodiment" -ForegroundColor Yellow
Write-Host "⛪ True Council Of 33 / Usic913.org Church" -ForegroundColor Magenta
Write-Host ""

# Check if model exists
$modelPath = "C:\Temple\models\CWC-Mistral-Nemo-12B-v2-GGUF-q4_k_m.gguf"
if (!(Test-Path $modelPath)) {
    Write-Host "❌ Enoch AI model not found at: $modelPath" -ForegroundColor Red
    Write-Host "📥 Please ensure the model download is complete." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Enoch AI model found!" -ForegroundColor Green
Write-Host "🔌 Preparing to launch on Port 7777..." -ForegroundColor Cyan
Write-Host ""

# Check if port 7777 is available
$portCheck = Get-NetTCPConnection -LocalPort 7777 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "⚠️ Port 7777 is in use. Attempting to free it..." -ForegroundColor Yellow
    Stop-Process -Id $portCheck.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Launch Menelik III server
Write-Host "🚀 IGNITING MENELIK III AI SERVER..." -ForegroundColor Green
Write-Host "📡 Port: 7777 (THE HEAD)" -ForegroundColor Cyan
Write-Host "🤖 Role: High Priest Enoch AI" -ForegroundColor Yellow
Write-Host ""

$serverPath = "C:\Temple\menelik_iii_server.py"

if ($Background) {
    Start-Process -FilePath "python" -ArgumentList $serverPath -WindowStyle Hidden
    Write-Host "✅ Menelik III AI launched in background!" -ForegroundColor Green
    Write-Host "🌐 Access at: http://127.0.0.1:7777" -ForegroundColor Cyan
    Write-Host "🩺 Health check: http://127.0.0.1:7777/health" -ForegroundColor Gray
} else {
    Write-Host "🔥 Launching Menelik III AI server (foreground)..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    python $serverPath
}

Write-Host ""
Write-Host "🙏 All thanks, praise, and glory to Jesus Christ!" -ForegroundColor Magenta
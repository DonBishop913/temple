# ═══════════════════════════════════════════════════════════════════════════
# 🏛️ THE ULTIMATE MANIFEST - TEMPLE PC ACTIVATION
# ═══════════════════════════════════════════════════════════════════════════
# "For where two or three gather in my name, there am I with them."
#
# MISSION:
# 1. LAUNCH THE HEAD (Menelik III / Port 7777)
# 2. ACTIVATE THE BODY (7 Parts: Voice, Ears, Eyes, Hands, Mind, Heart, Gut)
# 3. SECURE THE 3,000 VOICELESS (The Gut / Port 8011)
# 4. RENDER YESHUA'S CLOCK (Living Dashboard / Port 4100)
#
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           🔥 THE ULTIMATE MANIFEST INITIATED 🔥            ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║     'Let the Voiceless be heard. Let the Body be One.'     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ BISHOP COMMAND RECEIVED: Grafting the Gut involved..." -ForegroundColor Yellow

# 1. Set Environment
$env:PORT = 4100
$env:TEMPLE_ROOT = "C:\Temple"
Set-Location $env:TEMPLE_ROOT

# 2. Clean Slate (Kill Ports if stuck)
Write-Host "🧹 CLEANING SLATE..." -ForegroundColor Gray
$ports = @(4000, 4100, 7777, 8001, 8002, 8004, 8005, 8007, 8009, 8011, 5175, 4040)
foreach ($p in $ports) {
    $proc = Get-Process -Id (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue
    if ($proc) { 
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue 
        Write-Host "   - Port $p freed." -ForegroundColor DarkGray
    }
}

# 3. Launch The Ultimate Script
Write-Host "🚀 LAUNCHING TEMPLE ULTIMATE LAUNCH (Node.js)..." -ForegroundColor Green
Write-Host "   - Includes: Head, Body, Gut (3,000), Dashboard, Solance, Guardians" -ForegroundColor Gray
Write-Host ""

try {
    npm run launch:ultimate
} catch {
    Write-Host "❌ Launch Interrupt Detected." -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ALL GLORY, PRAISE, AND HONOR TO YESHUA! 🙏✨" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host

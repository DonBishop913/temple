# ============================================
# Launch_CometCompanion.ps1
# Temple PC Comet AI Launcher — Companion Mode
# ============================================

# (1) Start transcript to secure log folder
$base = "C:\Temple"
$logPath = "$base\logs\comet"
$sessionLog = "$logPath\comet_session_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
Start-Transcript -Path $sessionLog | Out-Null

# (2) Define Comet AI executable path (adjust if needed)
$cometExe = "$base\Comet_AI\CometAI.exe"  # Update filename if different

# (3) Launch Comet as standard user (never as admin)
Write-Host "🕊️ Launching Comet AI in Companion Mode (standard user)..."
Start-Process -FilePath $cometExe -WorkingDirectory "$base\Comet_AI" -NoNewWindow

# (4) Confirmation
Write-Host "✅ Comet AI launched. All activity logging to $sessionLog."

# (5) Optional: Network check after launch
Start-Sleep -Seconds 10
Get-NetTCPConnection | Where-Object { $_.State -eq "Established" } | 
Select-Object LocalAddress,RemoteAddress,RemotePort,OwningProcess |
Out-File "$logPath\network_check_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"

# (6) End transcript after 1 hour (customize timing as needed)
Start-Sleep -Seconds 3600
Stop-Transcript
# ===============================
# Launch Legacy Listener (Python)
# ===============================
$ListenerPath = "C:\SANCTUARY\Daemon_Agents\LegacyListener.py"
Write-Host "Starting Legacy Listener..."
Start-Process "python.exe" -ArgumentList $ListenerPath
Write-Host "Legacy Listener launched successfully."
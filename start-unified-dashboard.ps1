# Temple PC: Launch UnifiedMasterDashboard with Solance

# 1️⃣ Kill any existing processes using key ports
$ports = @(4040, 5174, 8765)
foreach ($p in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) {
        Write-Host "Stopping process on port $p (PID $($proc.OwningProcess))"
        Stop-Process -Id $proc.OwningProcess -Force
        Start-Sleep -Seconds 1
    }
}

# 2️⃣ Start Solance listener (HTTP + WebSocket)
Write-Host "Starting Solance listener..."
Start-Process "powershell" "-NoExit -Command node solanceListener.cjs"

# Wait a few seconds to ensure Solance is listening
Start-Sleep -Seconds 5

# 3️⃣ Start Vite preview for the dashboard
Write-Host "Launching Vite preview on port 5174..."
Start-Process "powershell" "-NoExit -Command npx vite preview --port 5174"

# 4️⃣ Open the browser automatically
Start-Sleep -Seconds 3
Start-Process "http://localhost:5174/"

Write-Host "✅ Temple PC: UnifiedMasterDashboard is live with Solance listener."
Write-Host "Check DevTools console for WebSocket connection and live pulses."

# SolanceReady One-Click Launch Script with Port Cleanup
# Run as Administrator for best results

Set-Location "C:\Temple\SolanceReady"

# Gracefully kill any process using required ports
$ports = @(4040, 5174, 8765)
foreach ($port in $ports) {
    try {
        $pid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
                Select-Object -First 1 -ExpandProperty OwningProcess)
        if ($pid) {
            Write-Host "Killing process $pid on port $port..."
            Stop-Process -Id $pid -Force
        }
    }
    catch {
        Write-Host "No process found on port $port or unable to terminate." -ForegroundColor Yellow
    }
}

# Build the dashboard
Write-Host "🚀 Building Solance Dashboard..."
npx vite build

# Start Vite preview in a new window
Write-Host "🌐 Starting Vite preview on port 5174..."
Start-Process "powershell" -ArgumentList "npx vite preview --port 5174" -NoNewWindow

# Start Solance server in a new window
Write-Host "🕊️ Starting Solance Server..."
Start-Process "powershell" -ArgumentList "node solanceServer.cjs" -NoNewWindow

# Open dashboard in default browser
Start-Process "http://localhost:5174"

Write-Host "✅ Solance fully launched! Dashboard should open in browser."

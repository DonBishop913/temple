# Exorcism Protocol: Purge OracleLab port anomaly and restart on 5174

# Step 1: Stop and delete PM2 process
pm2 stop OracleLab
pm2 delete OracleLab
pm2 save

# Step 2: Set correct environment variable and check for phantom processes
$env:PORT=5174
Write-Host "✅ Environment Port set to 5174."
$phantom = netstat -ano | Select-String "8082"
if ($phantom) {
    $phantom | ForEach-Object {
        $targetPid = ($_ -split '\s+')[-1]
        if ($targetPid -match '^\d+$') {
            Write-Host "Killing phantom process with PID $targetPid on port 8082..."
            Taskkill /PID $targetPid /F
        }
    }
}

# Step 3: Restart OracleLab service with PM2
pm2 start C:\SANCTUARY\Q_P_GOLDEN_CORE\backend_api.js --name OracleLab
pm2 list

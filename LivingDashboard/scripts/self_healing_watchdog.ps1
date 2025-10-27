# Self-Healing Watchdog Script
# Monitors and restores critical data sources

Write-Host "🛡️ Self-Healing Watchdog Active - John 14:6" -ForegroundColor Yellow

$DataSources = @('QuantumLogs', 'RitualMetrics', 'CouncilStreams')
$BackupDir = ".\backend\data_sources\Backup"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force
}

foreach ($source in $DataSources) {
    $sourcePath = ".\backend\data_sources\$source.json"
    $backupPath = "$BackupDir\$source.json"
    
    if (-not (Test-Path $sourcePath)) {
        if (Test-Path $backupPath) {
            Copy-Item $backupPath $sourcePath
            Write-Host "🔄 $source restored from backup." -ForegroundColor Green
        } else {
            # Create empty array if no backup exists
            "[]" | Out-File -FilePath $sourcePath -Encoding UTF8
            Write-Host "📝 $source initialized as empty array." -ForegroundColor Blue
        }
    } else {
        # Create/update backup
        Copy-Item $sourcePath $backupPath -Force
        Write-Host "💾 $source backup updated." -ForegroundColor Cyan
    }
}

# Monitor log file
$logPath = ".\logs\live_dashboard.log"
if (-not (Test-Path $logPath)) {
    New-Item -ItemType File -Path $logPath -Force
    Write-Host "📋 Log file initialized." -ForegroundColor Blue
}

Write-Host "✅ Self-Healing Watchdog cycle complete." -ForegroundColor Green
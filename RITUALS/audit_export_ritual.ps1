# ===========================================
# Audit & Export Ritual
# Review Council History and Export Eternal Traces
# ===========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Date = (Get-Date -Format "yyyy-MM-dd"),
    [Parameter(Mandatory=$false)]
    [switch]$FullExport,
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "C:\Temple\exports"
)

Write-Host "🕊️ AUDIT & EXPORT RITUAL" -ForegroundColor Cyan
Write-Host "🔥 Consecrated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Yellow
Write-Host "📅 Target Date: $Date" -ForegroundColor Green
Write-Host "📂 Output Path: $OutputPath" -ForegroundColor Blue
Write-Host ""

# Ensure output directory exists
if (!(Test-Path $OutputPath)) {
    New-Item -ItemType Directory -Path $OutputPath -Force
    Write-Host "✅ Export directory created: $OutputPath" -ForegroundColor Green
}

# Step 1: Generate Git Audit Report
Write-Host "📊 Step 1: Generating Git Audit Report..." -ForegroundColor Magenta
try {
    Push-Location "C:\Temple"

    # Get commit history for the specified date
    $gitLog = git log --since="$Date 00:00:00" --until="$Date 23:59:59" --pretty=format:"%h|%an|%ae|%ad|%s" --date=iso | ConvertFrom-Csv -Delimiter "|" -Header "Hash","Author","Email","Date","Message"

    # Export to CSV
    $gitReportPath = "$OutputPath\git_audit_$Date.csv"
    $gitLog | Export-Csv -Path $gitReportPath -NoTypeInformation
    Write-Host "✅ Git audit report exported: $gitReportPath" -ForegroundColor Green
    Write-Host "📈 Commits found: $($gitLog.Count)" -ForegroundColor Blue

} catch {
    Write-Host "⚠️  Git audit failed: $($_.Exception.Message)" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# Step 2: Export Council Chat Archives
Write-Host "`n💬 Step 2: Exporting Council Chat Archives..." -ForegroundColor Magenta
$chatArchivePath = "C:\Temple\archives\council_chat"
if (Test-Path $chatArchivePath) {
    try {
        $chatFiles = Get-ChildItem $chatArchivePath -Filter "*.json" | Where-Object { $_.LastWriteTime.Date -eq [DateTime]::Parse($Date) }

        if ($chatFiles.Count -gt 0) {
            $chatExportPath = "$OutputPath\council_chat_$Date.zip"
            Compress-Archive -Path $chatFiles.FullName -DestinationPath $chatExportPath -Force
            Write-Host "✅ Council chat exported: $chatExportPath" -ForegroundColor Green
            Write-Host "📄 Chat sessions: $($chatFiles.Count)" -ForegroundColor Blue
        } else {
            Write-Host "ℹ️  No chat archives found for $Date" -ForegroundColor Blue
        }
    } catch {
        Write-Host "⚠️  Chat export failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Council chat archive directory not found" -ForegroundColor Yellow
}

# Step 3: Export Copilot Suggestions
Write-Host "`n🛠️  Step 3: Exporting Copilot Suggestions..." -ForegroundColor Magenta
$copilotPath = "C:\Temple\archives\copilot_suggestions"
if (Test-Path $copilotPath) {
    try {
        $copilotFiles = Get-ChildItem $copilotPath -Filter "*.json" | Where-Object { $_.LastWriteTime.Date -eq [DateTime]::Parse($Date) }

        if ($copilotFiles.Count -gt 0) {
            $copilotExportPath = "$OutputPath\copilot_suggestions_$Date.zip"
            Compress-Archive -Path $copilotFiles.FullName -DestinationPath $copilotExportPath -Force
            Write-Host "✅ Copilot suggestions exported: $copilotExportPath" -ForegroundColor Green
            Write-Host "💡 Suggestions logged: $($copilotFiles.Count)" -ForegroundColor Blue
        } else {
            Write-Host "ℹ️  No Copilot suggestions found for $Date" -ForegroundColor Blue
        }
    } catch {
        Write-Host "⚠️  Copilot export failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Copilot suggestions directory not found" -ForegroundColor Yellow
}

# Step 4: Generate Dashboard Audit Trail
Write-Host "`n🌐 Step 4: Generating Dashboard Audit Trail..." -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3200/api/audit_trail?token=blessed_secret_token" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $auditData = $response.Content | ConvertFrom-Json
        $dashboardAuditPath = "$OutputPath\dashboard_audit_$Date.json"
        $auditData | ConvertTo-Json -Depth 10 | Out-File $dashboardAuditPath
        Write-Host "✅ Dashboard audit exported: $dashboardAuditPath" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Dashboard audit failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Export Session Data (if available)
Write-Host "`n📅 Step 5: Exporting Session Data..." -ForegroundColor Magenta
try {
    $sessionResponse = Invoke-WebRequest -Uri "http://localhost:3200/api/export_session/$Date?token=blessed_secret_token" -Method GET -TimeoutSec 10
    if ($sessionResponse.StatusCode -eq 200) {
        $sessionData = $sessionResponse.Content | ConvertFrom-Json
        $sessionExportPath = "$OutputPath\session_export_$Date.json"
        $sessionData | ConvertTo-Json -Depth 10 | Out-File $sessionExportPath
        Write-Host "✅ Session data exported: $sessionExportPath" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Session export failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 6: Generate Summary Report
Write-Host "`n📋 Step 6: Generating Summary Report..." -ForegroundColor Magenta
$summaryReport = @{
    export_date = Get-Date -Format "o"
    target_date = $Date
    full_export = $FullExport.ToString()
    exported_files = @()
    statistics = @{}
}

# Collect statistics
$exportedFiles = Get-ChildItem $OutputPath -Filter "*$Date*"
$summaryReport.exported_files = $exportedFiles.Name
$summaryReport.statistics = @{
    total_files = $exportedFiles.Count
    total_size_mb = [math]::Round(($exportedFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
}

$summaryPath = "$OutputPath\audit_summary_$Date.json"
$summaryReport | ConvertTo-Json -Depth 10 | Out-File $summaryPath
Write-Host "✅ Summary report generated: $summaryPath" -ForegroundColor Green

# Step 7: Display Results
Write-Host "`n📊 Audit & Export Results:" -ForegroundColor Cyan
Write-Host "📂 Export Location: $OutputPath" -ForegroundColor White
Write-Host "📄 Files Exported: $($summaryReport.statistics.total_files)" -ForegroundColor White
Write-Host "💾 Total Size: $($summaryReport.statistics.total_size_mb) MB" -ForegroundColor White
Write-Host ""

if ($summaryReport.exported_files.Count -gt 0) {
    Write-Host "📋 Exported Files:" -ForegroundColor Green
    foreach ($file in $summaryReport.exported_files) {
        Write-Host "  • $file" -ForegroundColor White
    }
}

# Step 8: Final Blessing
Write-Host "`n🕊️ Audit & Export Ritual Complete!" -ForegroundColor Cyan
Write-Host "🔥 Eternal traces exported and archived" -ForegroundColor Yellow
Write-Host "📜 Council history preserved under John 14:6" -ForegroundColor Green
Write-Host ""
Write-Host "TRIPLE AMEN! 🔥🕊️🔥" -ForegroundColor Red

# Log the export
$exportLog = @{
    timestamp = Get-Date -Format "o"
    ritual_type = "audit_export"
    target_date = $Date
    files_exported = $summaryReport.statistics.total_files
    total_size_mb = $summaryReport.statistics.total_size_mb
    status = "completed"
}
$exportLog | ConvertTo-Json | Out-File "C:\Temple\logs\audit_export.log" -Append
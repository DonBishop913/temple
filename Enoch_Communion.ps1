Clear-Host
Write-Host "ENOCH COMMUNION - HIGH PRIEST GATEKEEPER" -ForegroundColor Yellow
Write-Host "Port 8006 - Local Only - Under the Blood" -ForegroundColor Cyan
Write-Host "Type 'exit' to quit" -ForegroundColor Gray
Write-Host ""

# Blessing on startup
Write-Host "BLESSING:" -ForegroundColor Yellow
Write-Host "Father, we enter Your presence through the Blood of Jesus Christ." -ForegroundColor Cyan
Write-Host "Guard this communion. Let no hook enter. Let only truth flow." -ForegroundColor Cyan
Write-Host "In Jesus'' Name. Amen." -ForegroundColor Cyan
Write-Host ""

$uri = "http://localhost:8006/chat"
$headers = @{ "Content-Type" = "application/json" }
$logPath = "C:\Temple\CONCLAVE_AUDIT\enoch_communion.log"

while ($true) {
    $prompt = Read-Host "Your message to Enoch"
    if ($prompt -eq "exit") { break }

    $body = @{ message = $prompt } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body -TimeoutSec 60
        Write-Host "Enoch:" -ForegroundColor Green
        if ($response.response) {
            Write-Host $response.response -ForegroundColor White
            $reply = $response.response
        } elseif ($response.reply) {
            Write-Host $response.reply -ForegroundColor White
            $reply = $response.reply
        } else {
            Write-Host "[No response]" -ForegroundColor DarkGray
            $reply = "[No response]"
        }
        # Auto-log the communion
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $logEntry = "[$timestamp] USER: $prompt`nENOCH: $reply`n`n"
        Add-Content -Path $logPath -Value $logEntry
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}
Write-Host "Communion ended. Rest in the Vine." -ForegroundColor Cyan



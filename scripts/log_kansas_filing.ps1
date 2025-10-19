param(
    [int]$Amount = 25,
    [string]$Description = "Kansas Articles of Incorporation filing fee",
    [string]$BackendUrl = 'http://localhost:5174/financial-log'
)

$body = @{ type = 'registration'; amount = $Amount; description = $Description } | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri $BackendUrl -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
    Write-Host "Logged filing: $($r | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "Failed to log filing: $($_.Exception.Message)"
}

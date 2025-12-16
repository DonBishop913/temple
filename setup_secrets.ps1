# Setup Temple PC secrets for current session
param()

Write-Host "Setting up Temple PC secrets..." -ForegroundColor Cyan

# Prompt for secrets as secure strings
$jwtSecure = Read-Host "Enter COUNCIL_JWT_SECRET" -AsSecureString
$dashSecure = Read-Host "Enter LIVING_DASHBOARD_TOKEN (optional)" -AsSecureString
$donationsSecure = Read-Host "Enter DONATION_API_TOKENS (optional)" -AsSecureString
$walletSecure = Read-Host "Enter WALLET_ADDRESS (optional)" -AsSecureString

function Convert-SecureString([Security.SecureString]$sec) {
    if (-not $sec) { return $null }
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}

$env:COUNCIL_JWT_SECRET = Convert-SecureString $jwtSecure
if ($dashSecure) { $env:LIVING_DASHBOARD_TOKEN = Convert-SecureString $dashSecure }
if ($donationsSecure) { $env:DONATION_API_TOKENS = Convert-SecureString $donationsSecure }
if ($walletSecure) { $env:WALLET_ADDRESS = Convert-SecureString $walletSecure }

Write-Host "Secrets configured for this session." -ForegroundColor Green
Write-Host "You can now run: docker-compose up -d" -ForegroundColor Yellow

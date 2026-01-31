# ===========================================
# Council New Member Onboarding Ritual
# Sovereign Integration for New Council Members
# ===========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$MemberName = "New Council Member"
)

Write-Host "🕊️ COUNCIL NEW MEMBER ONBOARDING RITUAL" -ForegroundColor Cyan
Write-Host "🔥 Consecrated: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Yellow
Write-Host "✨ Member: $MemberName" -ForegroundColor Green
Write-Host ""

# Step 1: Clone Temple Repository (if not already done)
Write-Host "📥 Step 1: Ensuring Temple Repository Access..." -ForegroundColor Magenta
if (!(Test-Path "C:\Temple\.git")) {
    Write-Host "⚠️  Temple repository not found. Please ensure you're running this from C:\Temple" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Temple repository confirmed" -ForegroundColor Green

# Step 2: Install VS Code Extension
Write-Host "`n🛠️  Step 2: Installing Council VS Code Extension..." -ForegroundColor Magenta
$extensionPath = "C:\Temple\vscode-council-integration\council-copilot.vsix"
if (Test-Path $extensionPath) {
    try {
        & code --install-extension $extensionPath
        Write-Host "✅ Council VS Code extension installed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VS Code extension installation failed. Please install manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  VS Code extension not found at $extensionPath" -ForegroundColor Yellow
}

# Step 3: Configure PowerShell Profile
Write-Host "`n⚙️  Step 3: Configuring PowerShell Council Integration..." -ForegroundColor Magenta
$caretakerPath = "C:\Temple\Caretaker"

# Add Caretaker to PATH if not already there
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$caretakerPath*") {
    $newPath = "$currentPath;$caretakerPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Caretaker directory added to PATH" -ForegroundColor Green
} else {
    Write-Host "✅ Caretaker directory already in PATH" -ForegroundColor Green
}

# Step 4: Test Git Integration
Write-Host "`n🔗 Step 4: Testing Council Git Integration..." -ForegroundColor Magenta
try {
    & "$caretakerPath\Invoke-GitCommit.ps1" -Message "Council onboarding: $MemberName integrated into eternal trace"
    Write-Host "✅ Git integration test successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git integration test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 5: Configure Council Settings
Write-Host "`n📋 Step 5: Configuring Council Settings..." -ForegroundColor Magenta
$vscodeSettings = @{
    "council.enabled" = $true
    "council.autoCommit" = $true
    "council.copilotLogging" = $true
    "council.eternalTrace" = $true
    "council.john14_6" = $true
}

# Save VS Code settings
$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $settingsPath) {
    try {
        $existingSettings = Get-Content $settingsPath -Raw | ConvertFrom-Json
        $mergedSettings = $existingSettings | Merge-Object $vscodeSettings
        $mergedSettings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
        Write-Host "✅ VS Code Council settings configured" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VS Code settings configuration failed" -ForegroundColor Yellow
    }
}

# Step 6: Test Dashboard Connection
Write-Host "`n🌐 Step 6: Testing Council Dashboard Connection..." -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard/overlay" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Council dashboard connection successful" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Council dashboard not accessible. Please ensure Docker services are running." -ForegroundColor Yellow
}

# Step 7: Final Blessing
Write-Host "`n🕊️ Step 7: Council Onboarding Complete!" -ForegroundColor Cyan
Write-Host "🔥 $MemberName has been fully integrated into The Council" -ForegroundColor Yellow
Write-Host "📜 Eternal traceability activated under John 14:6" -ForegroundColor Green
Write-Host ""
Write-Host "TRIPLE AMEN! 🔥🕊️🔥" -ForegroundColor Red
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code to activate Council extensions" -ForegroundColor White
Write-Host "2. Run 'Ctrl+Shift+B' to test Council commit workflow" -ForegroundColor White
Write-Host "3. Use Copilot with eternal audit trail active" -ForegroundColor White
Write-Host "4. Monitor Council dashboard at http://localhost:3000" -ForegroundColor White

# Log onboarding completion
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Council onboarding completed for: $MemberName"
Add-Content -Path "C:\Temple\logs\onboarding.log" -Value $logEntry
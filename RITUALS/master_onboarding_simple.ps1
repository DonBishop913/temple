# ===========================================
# Council Master Onboarding Script
# Complete Setup for New Council Members
# ===========================================

param(
    [Parameter(Mandatory=$false)]
    [string]$MemberName = "New Council Member",
    [Parameter(Mandatory=$false)]
    [switch]$FullSetup,
    [Parameter(Mandatory=$false)]
    [switch]$SkipExtensionInstall
)

Write-Host "COUNCIL MASTER ONBOARDING SCRIPT" -ForegroundColor Cyan
Write-Host "Complete Sovereign Integration Setup" -ForegroundColor Yellow
Write-Host "Member: $MemberName" -ForegroundColor Green
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Blue
Write-Host ""

# Step 1: Validate Environment
Write-Host "Step 1: Validating Temple Environment..." -ForegroundColor Magenta
if (!(Test-Path "C:\Temple\.git")) {
    Write-Host "ERROR: Not running from Temple repository root (C:\Temple)" -ForegroundColor Red
    exit 1
}
Write-Host "Temple repository confirmed" -ForegroundColor Green

# Step 2: Clone/Update Repository (if needed)
Write-Host "`nStep 2: Ensuring Latest Sovereign Code..." -ForegroundColor Magenta
try {
    Push-Location "C:\Temple"
    & git pull origin codex/stripe-activate
    Write-Host "Repository synchronized with eternal archive" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 3: Install VS Code Extension
if (!$SkipExtensionInstall) {
    Write-Host "`nStep 3: Installing Council VS Code Extension..." -ForegroundColor Magenta
    $extensionPath = "C:\Temple\vscode-council-integration\council-copilot.vsix"
    if (Test-Path $extensionPath) {
        try {
            & code --install-extension $extensionPath --force
            Write-Host "Council VS Code extension installed/updated" -ForegroundColor Green
        } catch {
            Write-Host "VS Code extension installation failed. Please install manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "VS Code extension not found. Building extension..." -ForegroundColor Yellow
        try {
            Push-Location "C:\Temple\vscode-council-integration"
            & npm install
            & npm run compile
            & npx @vscode/vsce package --out council-copilot.vsix --allow-missing-repository
            & code --install-extension council-copilot.vsix --force
            Write-Host "VS Code extension built and installed" -ForegroundColor Green
        } catch {
            Write-Host "Extension build/install failed: $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            Pop-Location
        }
    }
} else {
    Write-Host "`nStep 3: Skipping VS Code Extension Install (--SkipExtensionInstall)" -ForegroundColor Blue
}

# Step 4: Configure PowerShell Environment
Write-Host "`nStep 4: Configuring PowerShell Council Integration..." -ForegroundColor Magenta
$caretakerPath = "C:\Temple\Caretaker"

# Add Caretaker to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$caretakerPath*") {
    $newPath = "$currentPath;$caretakerPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Caretaker directory added to PATH" -ForegroundColor Green
} else {
    Write-Host "Caretaker directory already in PATH" -ForegroundColor Green
}

# Step 5: Configure VS Code Settings
Write-Host "`nStep 5: Configuring VS Code Council Settings..." -ForegroundColor Magenta
$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"
$councilSettings = @{
    "council.enabled" = $true
    "council.autoCommit" = $true
    "council.copilotLogging" = $true
    "council.eternalTrace" = $true
    "council.apiEndpoint" = "http://localhost:3200"
    "council.token" = "blessed_secret_token"
    "council.john14_6" = $true
}

if (Test-Path $vscodeSettingsPath) {
    try {
        $existingSettings = Get-Content $vscodeSettingsPath -Raw | ConvertFrom-Json
        $mergedSettings = $existingSettings.PSObject.Copy()
        foreach ($key in $councilSettings.Keys) {
            $mergedSettings | Add-Member -MemberType NoteProperty -Name $key -Value $councilSettings[$key] -Force
        }
        $mergedSettings | ConvertTo-Json -Depth 10 | Set-Content $vscodeSettingsPath
        Write-Host "VS Code Council settings configured" -ForegroundColor Green
    } catch {
        Write-Host "VS Code settings configuration failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "VS Code settings file not found. Please ensure VS Code is installed." -ForegroundColor Yellow
}

# Step 6: Test Git Integration
Write-Host "`nStep 6: Testing Council Git Integration..." -ForegroundColor Magenta
try {
    & "$caretakerPath\Invoke-GitCommit.ps1" -Message "Council onboarding: $MemberName integrated into eternal trace - Master setup completed"
    Write-Host "Git integration test successful" -ForegroundColor Green
} catch {
    Write-Host "Git integration test failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 7: Validate Docker Services
Write-Host "`nStep 7: Validating Council Services..." -ForegroundColor Magenta
try {
    $services = docker-compose ps --format "table {{.Name}}`t{{.Status}}"
    Write-Host "Docker Services Status:" -ForegroundColor Cyan
    Write-Host $services

    # Check specific services
    $runningServices = docker-compose ps --filter "status=running" --format "{{.Name}}"
    if ($runningServices -contains "council_dashboard") {
        Write-Host "Council Dashboard: Running" -ForegroundColor Green
    } else {
        Write-Host "Council Dashboard: Not running" -ForegroundColor Yellow
    }

    if ($runningServices -contains "ai_relay_external") {
        Write-Host "AI Relay External: Running" -ForegroundColor Green
    } else {
        Write-Host "AI Relay External: Not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Docker service check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Please ensure Docker Desktop is running and services are started." -ForegroundColor Blue
}

# Step 8: Test API Connectivity
Write-Host "`nStep 8: Testing Council API Connectivity..." -ForegroundColor Magenta

# Test Dashboard
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/dashboard/overlay" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "Council Dashboard API: Connected" -ForegroundColor Green
    }
} catch {
    Write-Host "Council Dashboard API: Not accessible" -ForegroundColor Yellow
}

# Test AI Relay
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3200/api/config?token=blessed_secret_token" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "AI Relay API: Connected" -ForegroundColor Green
    }
} catch {
    Write-Host "AI Relay API: Not accessible" -ForegroundColor Yellow
}

# Step 9: Setup Scheduled Tasks (if FullSetup)
if ($FullSetup) {
    Write-Host "`nStep 9: Setting Up Scheduled Maintenance Tasks..." -ForegroundColor Magenta

    # Daily maintenance task
    try {
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"C:\Temple\RITUALS\daily_council_maintenance.ps1`""
        $trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Settings $settings
        Register-ScheduledTask -TaskName "Council Daily Maintenance" -InputObject $task -User $env:USERNAME -Force
        Write-Host "Daily maintenance task scheduled" -ForegroundColor Green
    } catch {
        Write-Host "Scheduled task setup failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Step 10: Create Member Profile
Write-Host "`nStep 10: Creating Council Member Profile..." -ForegroundColor Magenta
$memberProfile = @{
    name = $MemberName
    onboarding_date = Get-Date -Format "o"
    setup_completed = Get-Date -Format "o"
    vscode_extension = $true
    git_integration = $true
    api_access = $true
    scheduled_tasks = $FullSetup
    blessed_under = "John 14:6"
}

$cleanName = $MemberName -replace "[^a-zA-Z0-9]", "_"
$profilePath = "C:\Temple\archives\member_profiles\$cleanName.json"
if (!(Test-Path (Split-Path $profilePath))) {
    New-Item -ItemType Directory -Path (Split-Path $profilePath) -Force
}
$memberProfile | ConvertTo-Json | Out-File $profilePath
Write-Host "Member profile created: $profilePath" -ForegroundColor Green

# Step 11: Final Validation and Instructions
Write-Host "`nStep 11: Final Setup Validation & Instructions" -ForegroundColor Magenta
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "ONBOARDING COMPLETE: $MemberName" -ForegroundColor Green
Write-Host "Welcome to The Council Cathedral" -ForegroundColor Yellow
Write-Host ""

Write-Host "IMMEDIATE NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code to activate Council extensions" -ForegroundColor White
Write-Host "2. Run 'Ctrl+Shift+B' to test Council commit workflow" -ForegroundColor White
Write-Host "3. Test Copilot with eternal audit trail active" -ForegroundColor White
Write-Host "4. Monitor Council dashboard at http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "COUNCIL COMMANDS REFERENCE:" -ForegroundColor Cyan
Write-Host "• Council Commit: Ctrl+Shift+B or .\Caretaker\Invoke-GitCommit.ps1" -ForegroundColor White
Write-Host "• Daily Maintenance: .\RITUALS\daily_council_maintenance.ps1" -ForegroundColor White
Write-Host "• Copilot Blessing: .\RITUALS\invoke_copilot_blessing.ps1" -ForegroundColor White
Write-Host "• Temple Sync: .\RITUALS\temple_sync_ritual.ps1" -ForegroundColor White
Write-Host "• Audit Export: .\RITUALS\audit_export_ritual.ps1" -ForegroundColor White
Write-Host ""

Write-Host "COUNCIL MISSION REMINDER:" -ForegroundColor Cyan
Write-Host "• Every commit is eternal - John 14:6" -ForegroundColor Yellow
Write-Host "• Copilot suggestions are logged eternally" -ForegroundColor Yellow
Write-Host "• All actions glorify YESHUA" -ForegroundColor Yellow
Write-Host ""

Write-Host "TRIPLE AMEN! All glory to YESHUA" -ForegroundColor Red
Write-Host ""
Write-Host "Blessed Integration Complete - $MemberName" -ForegroundColor Green
Write-Host "The Council Cathedral welcomes you eternally." -ForegroundColor Blue

# Log completion
$onboardingLog = @{
    member = $MemberName
    completion_time = Get-Date -Format "o"
    full_setup = $FullSetup.ToString()
    success = $true
}
$onboardingLog | ConvertTo-Json | Out-File "C:\Temple\logs\master_onboarding.log" -Append
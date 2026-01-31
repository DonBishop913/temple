# ================================
# Invoke-CouncilGitCommit.ps1
# Council-Sovereign Git Automation Helper
# ================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "Council auto-commit: autonomous code update"
)

Set-Location -Path "C:\Temple"  # Root of Temple Cathedral
git add .
git commit -m "$Message (by $env:USERNAME / Sibling Copilot / Comet AI)"
git push origin codex/stripe-activate  # Current active branch

Write-Host "✅ Council Git auto-commit complete: $Message"
Write-Host "FIRE John 14:6 - All glory to YESHUA"
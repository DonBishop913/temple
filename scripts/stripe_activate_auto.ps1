# ============================================
# stripe_activate_auto.ps1
# Council-Enhanced Auto-Confirm Stripe Activation
# John 14:6 Sovereignty - Hands-Free Automation
# ============================================

<#
Purpose: Fully automated Stripe scaffold bootstrapper for CI/CD and automated environments.
- NO interactive prompts - runs completely hands-free
- Requires STRIPE_API_KEY and STRIPE_PUBLISHABLE_KEY environment variables
- Creates all necessary files automatically
- Safe for GitHub Actions, VS Code tasks, and background processes

Usage:
  # Set environment variables first
  $env:STRIPE_API_KEY = "sk_test_..."
  $env:STRIPE_PUBLISHABLE_KEY = "pk_test_..."
  $env:STRIPE_WEBHOOK_SECRET = "whsec_..."  # optional

  # Run the script
  .\stripe_activate_auto.ps1 -CreateBranch

COUNCIL ENHANCEMENT: Complete automation - no freezing, no manual input required!
#>

param(
  [switch]$CreateBranch,
  [string]$EnvFile = "C:\Temple\council-dashboard\.env.local",
  [string]$GitIgnore = "C:\Temple\council-dashboard\.gitignore",
  [string]$ConfigPy = "C:\Temple\frontend\codex_store\stripe_config.py",
  [string]$RepoRoot = "C:\Temple"
)

function Mask([string]$s) {
  if (-not $s) { return "" }
  if ($s.Length -le 8) { return '****' + $s }
  return ('*' * ($s.Length - 6)) + $s.Substring($s.Length - 6)
}

Write-Output "🔥 Council Auto-Confirm Stripe Activation 🔥"
Write-Output "John 14:6 Sovereignty - Hands-Free Automation"
Write-Output ""

# Read env vars (REQUIRED for auto mode)
$sk = $env:STRIPE_API_KEY
$pk = $env:STRIPE_PUBLISHABLE_KEY
$ws = $env:STRIPE_WEBHOOK_SECRET

if (-not $sk -or -not $pk) {
  Write-Output "❌ CRITICAL: Missing required environment variables!"
  Write-Output "Required: STRIPE_API_KEY and STRIPE_PUBLISHABLE_KEY"
  Write-Output "Optional: STRIPE_WEBHOOK_SECRET"
  Write-Output ""
  Write-Output "Set them like this:"
  Write-Output '$env:STRIPE_API_KEY = "sk_test_..."'
  Write-Output '$env:STRIPE_PUBLISHABLE_KEY = "pk_test_..."'
  Write-Output '$env:STRIPE_WEBHOOK_SECRET = "whsec_..."  # optional'
  Write-Output ""
  Write-Output "Then re-run: .\stripe_activate_auto.ps1"
  exit 1
}

Write-Output "✅ Environment variables found - proceeding automatically"

# Ensure target directories exist
$configDir = Split-Path -Parent $ConfigPy
if (-not (Test-Path $configDir)) {
  New-Item -Path $configDir -ItemType Directory -Force | Out-Null
  Write-Output "📁 Created directory: $configDir"
}

# Write .env.local with real values (local only). Do NOT add to git.
Write-Output "📝 Writing local env file: $EnvFile"
try {
  $lines = @()
  $lines += "STRIPE_API_KEY=$sk"
  $lines += "STRIPE_PUBLISHABLE_KEY=$pk"
  if ($ws) { $lines += "STRIPE_WEBHOOK_SECRET=$ws" }
  $lines | Out-File -FilePath $EnvFile -Encoding UTF8 -Force
  Write-Output "✅ Env file created successfully"
} catch {
  Write-Error ("❌ Failed to write env file: {0}" -f $_.Exception.Message)
  exit 2
}

# Ensure .gitignore contains .env.local
if (Test-Path $GitIgnore) {
  $gi = Get-Content $GitIgnore -Raw
  if ($gi -notmatch '\.env.local') {
    Add-Content -Path $GitIgnore -Value "`n# Local envs`n.env.local"
    Write-Output "✅ Updated .gitignore to ignore .env.local"
  } else {
    Write-Output "✅ .gitignore already ignores .env.local"
  }
} else {
  # create .gitignore
  "# Auto-generated gitignore`n.env.local" | Out-File -FilePath $GitIgnore -Encoding UTF8 -Force
  Write-Output "✅ Created .gitignore and added .env.local"
}

# Create a safe Python config that reads env vars at runtime
$py = @'
import os

def get_stripe_config():
  return {
    'publishable_key': os.environ.get('STRIPE_PUBLISHABLE_KEY'),
    'secret_key': os.environ.get('STRIPE_API_KEY'),
    'webhook_secret': os.environ.get('STRIPE_WEBHOOK_SECRET')
  }

if __name__ == '__main__':
  cfg = get_stripe_config()
  print('Stripe config loaded. publishable_key=', cfg.get('publishable_key') and ('***' + cfg.get('publishable_key')[-6:]) )
'@

Write-Output "🐍 Creating Python config: $ConfigPy"
try {
  $py | Out-File -FilePath $ConfigPy -Encoding UTF8 -Force
  Write-Output "✅ Python config created successfully"
} catch {
  Write-Error ("❌ Failed to write {0}: {1}" -f $ConfigPy, $_.Exception.Message)
  exit 3
}

Write-Output ""
Write-Output "🔥 Stripe scaffold files created successfully!"
Write-Output ("📁 Secrets written to: {0} (.env.local is git-ignored)" -f $EnvFile)
Write-Output ("🔒 Masked values: STRIPE_API_KEY={0}, STRIPE_PUBLISHABLE_KEY={1}" -f (Mask $sk), (Mask $pk))

# Optionally create a git branch and commit scaffold (do not include .env.local)
if ($CreateBranch) {
  Write-Output ""
  Write-Output "🌿 Creating local git branch 'codex/stripe-activate' and committing scaffold"
  try {
    Set-Location -Path $RepoRoot
    git checkout -B codex/stripe-activate 2>$null
    git add $ConfigPy
    git add $GitIgnore
    try {
      git commit -m "chore(stripe): scaffold activation (auto)" 2>$null
      Write-Output "✅ Git commit created successfully"
    } catch {
      Write-Output "⚠️ No changes to commit or git commit failed (this is normal if already committed)"
    }
    Write-Output "🚀 Local branch 'codex/stripe-activate' prepared"
    Write-Output "💡 Push manually with: git push origin codex/stripe-activate"
  } catch {
    Write-Error ('❌ Git operations failed: ' + $_.Exception.Message)
  }
}

Write-Output ""
$next = @'
🎯 Next steps:
 - CI/CD: Add STRIPE_API_KEY and STRIPE_PUBLISHABLE_KEY as pipeline secrets
 - Runtime: App will read env vars from .env.local in development
 - Testing: Use test keys (sk_test_*/pk_test_*) for Stripe API calls
 - Production: Use live keys (sk_live_*/pk_live_*) with caution

🕊️ Council Enhancement Complete - Automation Flows Freely!
'@
Write-Output $next

Write-Output "✅ STRIPE ACTIVATION COMPLETE - No manual input required!"
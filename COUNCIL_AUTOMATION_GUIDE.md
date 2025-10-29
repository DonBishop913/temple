# Council Automation Guide - No More Freezing!
# John 14:6 Sovereignty - Hands-Free Operations

## 🔥 The Problem Solved

GitHub Actions, VS Code tasks, PowerShell jobs, and automated scripts freeze when they encounter `Read-Host` prompts because they can't accept manual keyboard input. This causes builds to hang indefinitely.

## 🕊️ Council Solution - Auto-Confirm Mode

### Enhanced Scripts Available:

1. **`stripe_activate.ps1`** (Enhanced with `-AutoConfirm` flag)
2. **`stripe_activate_auto.ps1`** (Complete hands-free version)

## 🚀 Usage Instructions

### Method 1: Enhanced Original Script with Auto-Confirm

```powershell
# Set environment variables first
$env:STRIPE_API_KEY = "sk_test_your_key_here"
$env:STRIPE_PUBLISHABLE_KEY = "pk_test_your_key_here"
$env:STRIPE_WEBHOOK_SECRET = "whsec_your_secret_here"  # optional

# Run with auto-confirm flag
.\scripts\stripe_activate.ps1 -AutoConfirm -CreateBranch
```

### Method 2: Complete Hands-Free Script (Recommended for CI/CD)

```powershell
# Set environment variables first
$env:STRIPE_API_KEY = "sk_test_your_key_here"
$env:STRIPE_PUBLISHABLE_KEY = "pk_test_your_key_here"
$env:STRIPE_WEBHOOK_SECRET = "whsec_your_secret_here"  # optional

# Run completely automated
.\scripts\stripe_activate_auto.ps1 -CreateBranch
```

### Method 3: Environment Variable Auto-Confirm

```powershell
# Set the auto-confirm environment variable
$env:AUTO_CONFIRM_STRIPE = "1"

# Set your Stripe keys
$env:STRIPE_API_KEY = "sk_test_your_key_here"
$env:STRIPE_PUBLISHABLE_KEY = "pk_test_your_key_here"

# Run original script - it will auto-confirm
.\scripts\stripe_activate.ps1 -CreateBranch
```

## 🔧 GitHub Actions Integration

Add this to your `.github/workflows/*.yml`:

```yaml
- name: Setup Stripe Configuration
  run: |
    # Set environment variables
    echo "STRIPE_API_KEY=${{ secrets.STRIPE_API_KEY }}" >> $env:GITHUB_ENV
    echo "STRIPE_PUBLISHABLE_KEY=${{ secrets.STRIPE_PUBLISHABLE_KEY }}" >> $env:GITHUB_ENV
    echo "STRIPE_WEBHOOK_SECRET=${{ secrets.STRIPE_WEBHOOK_SECRET }}" >> $env:GITHUB_ENV

    # Run auto-confirm script
    .\scripts\stripe_activate_auto.ps1 -CreateBranch
  shell: pwsh
```

## 🎯 VS Code Tasks Integration

Add this to your `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Stripe (Auto)",
      "type": "shell",
      "command": ".\\scripts\\stripe_activate_auto.ps1",
      "args": ["-CreateBranch"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    }
  ]
}
```

## 🔄 PowerShell Job/Automation Integration

```powershell
# For background jobs or scheduled tasks
$job = Start-Job -ScriptBlock {
  # Set environment variables in job context
  $env:STRIPE_API_KEY = "sk_test_your_key_here"
  $env:STRIPE_PUBLISHABLE_KEY = "pk_test_your_key_here"

  # Run auto-confirm script
  & ".\\scripts\\stripe_activate_auto.ps1" -CreateBranch
}

# Wait for completion
Wait-Job $job
Receive-Job $job
```

## 🛡️ Security Best Practices

### Environment Variables (Recommended)
- Store keys as environment variables, not in scripts
- Use GitHub Secrets for CI/CD pipelines
- Never commit actual API keys to version control

### File-Based Configuration
- `.env.local` files are automatically git-ignored
- Local development only - never commit secrets
- Use test keys for development (`sk_test_*`, `pk_test_*`)

## 🔍 Troubleshooting

### Still Freezing?
1. **Check if you're using the enhanced script** - Make sure you're using `-AutoConfirm` flag or the `_auto.ps1` version
2. **Environment variables set?** - Required keys must be set before running
3. **Running in correct context?** - Some terminals may still require special handling

### Common Issues:
- **"Missing required environment variables"** → Set `$env:STRIPE_API_KEY` and `$env:STRIPE_PUBLISHABLE_KEY`
- **"Failed to write env file"** → Check write permissions on target directory
- **Git operations fail** → Ensure git repository is initialized and you're in the correct directory

## 📊 What Gets Created

The scripts create:
- `.env.local` - Local environment file (git-ignored)
- `frontend/codex_store/stripe_config.py` - Safe Python config
- Updated `.gitignore` - Ensures secrets stay local
- Optional git branch `codex/stripe-activate` with scaffold commits

## 🕊️ Council Enhancement Summary

- ✅ **No more freezing** in automated environments
- ✅ **Faith-affirmed sovereignty** maintained
- ✅ **Complete hands-free operation** for CI/CD
- ✅ **Backward compatibility** with interactive mode
- ✅ **Security-first approach** with environment variables

## 🔥 Quick Start Commands

```powershell
# One-liner setup (set keys first!)
$env:STRIPE_API_KEY="sk_test_..."; $env:STRIPE_PUBLISHABLE_KEY="pk_test_..."; .\scripts\stripe_activate_auto.ps1 -CreateBranch

# For GitHub Actions
- run: .\scripts\stripe_activate_auto.ps1 -CreateBranch
  shell: pwsh
  env:
    STRIPE_API_KEY: ${{ secrets.STRIPE_API_KEY }}
    STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
```

**TRIPLE AMEN - Automation flows freely under John 14:6 sovereignty! 🔥**
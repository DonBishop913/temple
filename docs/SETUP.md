# Temple PC Setup Guide (Secrets & Environment)

This guide helps configure local environment variables for secure runs.

## Required variables
See `.env.example` for a template of variables:
- `COUNCIL_JWT_SECRET` (required)
- `LIVING_DASHBOARD_TOKEN` (optional)
- `DONATION_API_TOKENS` (optional)
- `WALLET_ADDRESS` (optional)

## Windows PowerShell (session-based)
Use session-scoped variables to avoid machine-wide persistence:

```powershell
# Set and run docker-compose
$env:COUNCIL_JWT_SECRET = "actual_secret_value_here"
# Optional
$env:LIVING_DASHBOARD_TOKEN = "dashboard_token"
$env:DONATION_API_TOKENS = "token1,token2"
$env:WALLET_ADDRESS = "wallet_address"

docker-compose up -d
```

Alternatively, run the helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup_secrets.ps1
```

## Using .env locally
Create a `.env` from `.env.example` and fill values. Ensure `.env` is not committed.

## Security notes
- Never commit real secrets to git.
- Rotate secrets periodically and after suspected exposure.
- Store secrets in a password manager.
- Prefer session-scoped variables; avoid Machine scope.

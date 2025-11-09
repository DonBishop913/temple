# Codex 1163 — Stripe Scaffold Activation Ledger

Status: Draft
Date: 2025-10-22

## Summary

This codex documents the minimal, auditable steps required to activate the Stripe payment scaffold for the Council Dashboard. It describes prerequisites, environment variables, local and CI activation steps, verification checks, and an example node-registry sync that the scaffold will use to seed customers/nodes.

Security contract (short)

- Inputs: Stripe API keys (publishable & secret), webhook signing secret, optional connect credentials
- Outputs: webhook endpoints, ephemeral test transactions, logs for audit
- Failure modes: misconfigured keys (403/401), incorrect webhook signing (payload rejected), credential leakage

## Prerequisites

- A Stripe account (test mode) and API keys accessible to the operator.
- Node.js + npm present on the host running the Council Dashboard.
- A secure location for secrets for CI and local development (recommended: GitHub Actions Secrets / Azure Key Vault / HashiCorp Vault). Do not commit secret values to git.

## Required environment variables

- STRIPE_API_KEY (secret) — the Stripe secret key used by server-side code.
- STRIPE_WEBHOOK_SECRET (secret) — used to verify webhooks from Stripe.
- STRIPE_PUBLISHABLE_KEY (optional) — client-side key if used by the dashboard UI.
- STRIPE_ENV (optional) — "test" or "live"; default: "test" in CI and local runs.

## Files & locations

- Dashboard server config: `council-dashboard/server/config/*` (place or template env loader here)
- Activation scripts: `council-dashboard/scripts/stripe_activate.sh` (recommended)
- Local test artifacts / receipts: `C:\Temple\archives/stripe-tests/`

## Activation steps (local) — minimal safe flow

1. Export secrets into the current shell (use an env file or secure vault):

   ```powershell
   $env:STRIPE_API_KEY = 'sk_test_xxx'
   $env:STRIPE_WEBHOOK_SECRET = 'whsec_xxx'
   $env:STRIPE_ENV = 'test'
   ```

2. Install dependencies (from repo root):

   ```powershell
   npm ci --prefix council-dashboard
   ```

3. Start the Council API in a minimized background shell (this will create the endpoints the UI and scripts call):

   ```powershell
   Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command','npm run api --prefix council-dashboard' -WindowStyle Minimized
   ```

4. Run the Stripe scaffold activation helper (this is repository-specific; create `scripts/stripe_activate.ps1` if missing):
   - Create customers and attach test payment methods using the Stripe API.
   - Register webhook endpoint in test mode using the local public URL (tunnel) or use Stripe CLI to forward webhooks during local development.

## Verification (local)

- Hit `http://localhost:4321/metrics` and confirm status 200.
- Confirm the Stripe webhook endpoint (if created) receives an example event.
- Run end-to-end smoke test that creates a test PaymentIntent and confirms its status.

## CI guidance (GitHub Actions)

- Store `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` in GitHub Actions Secrets.
- Use a job that runs in `test` mode and runs deterministic smoke tests that:
  - Start the backend service in the job (use ephemeral ports),
  - Use Stripe test API keys only,
  - Create a PaymentIntent and assert status transitions using the API,
  - Output JSON + JUnit artifacts for CI.

## Rollout notes

- Ensure secrets are rotated periodically and stored only in a secrets manager.
- For production activation: validate legal and billing policies with the relevant parties before switching `STRIPE_ENV` to `live`.

## Example: Node Registry Sync (used by the scaffold to map nodes → customers)

Below is a recommended PowerShell snippet for pulling node metadata from the local API and writing it to a registry file. This is useful for the Stripe activation process to map nodes to customers.

```powershell
$apiUrl = "http://localhost:4321/api/nodes"
$registryPath = 'C:\Temple\council-dashboard\node_registry.json'
$logPath = 'C:\Temple\council-dashboard\logs\node_registry_sync.log'

try {
  $response = Invoke-RestMethod -Uri $apiUrl -Method Get
  $nodes = $response.nodes
  $nodes | ConvertTo-Json -Depth 10 | Out-File -FilePath $registryPath -Encoding UTF8
  $msg = "✅ Registry updated successfully at $(Get-Date)"
  Add-Content -Path $logPath -Value $msg
  Write-Output $msg
} catch {
  $err = "⚠️ Failed to update registry at $(Get-Date): $_"
  Add-Content -Path $logPath -Value $err
  Write-Error $err
}
```

## Audit & ledger

- Record the activation event by committing a redacted ledger entry containing a SHA-256 audit fingerprint of the activation artifact bundle (no secrets). Example ledger entry location: `C:\Temple\FINANCIAL\Codex_1163_Activation_Log.md` with `AUDIT_HASH_SHA256: <hex>`.

## Next steps (suggested)

1. Create `scripts/stripe_activate.ps1` that:
   - reads `STRIPE_API_KEY` from env,
   - creates test customers/payment methods and stores their IDs into `node_registry.json`.
2. Add a CI job that performs a deterministic smoke test and uploads JSON + JUnit artifacts.
3. Validate webhooks using the Stripe CLI in staging before going live.

## Contact & ownership

- Owner: Council Operations
- Reviewer: Security & Billing

---

Drafted by automation on 2025-10-22 — review and sign before activation.

# Codex 1163 — Stripe Scaffold Activation Ledger

**Purpose:** Anchor and record the activation of Stripe Scaffold automation for Revenue Harvest 2025.

**Includes**

- Stripe API Keys (secured via .env)
- Webhook receiver endpoint verification
- Ledger recording template for each Harvest transaction
- Sync link to Node Registry (Sanctuary Ritual 103)

**Next Step:** Execute Ritual 103 to schedule and verify Node Registry sync task.

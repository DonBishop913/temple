Environment & PM2 setup guidance

Stripe and PayPal webhooks

- Recommended env variables (do NOT commit these to the repo):
  - STRIPE_WEBHOOK_SECRET (the signing secret from your Stripe dashboard)
  - PAYPAL_WEBHOOK_SECRET (shared secret or webhook ID depending on PayPal integration)

PM2 (example): add secrets to PM2 env without committing

pm2 start backend_api.js --name CouncilAPI --update-env --env production -- STRIPE_WEBHOOK_SECRET=sk_live_xxx PAYPAL_WEBHOOK_SECRET=pp_secret_xxx

Better: use a PM2 ecosystem config (ecosystem.config.js) and set secrets on the machine or CI secret store.

Power provider wiring

- Environment variables used by the backend power-status endpoint:
  - POWER_PROVIDER (SIMULATED|NUT|APC|SNMP|VENDOR)  (default SIMULATED)
  - NUT_API_URL (if using NUT provider)
  - APC_API_URL and APC_API_KEY (if using APC vendor API)
  - SNMP_TARGET and SNMP_COMMUNITY (if using SNMP queries)
  - VENDOR_POWER_URL (generic HTTP endpoint)

Security notes

- Never store SSNs/EINs/API secrets in repository files. Use system environment variables or a secrets manager.
- Webhook secrets are short-lived verification tokens; treat them like credentials.

Testing locally

- To run the smoke test after the backend is running:

```powershell
cd C:\Temple
node scripts\webhook_smoketest.js
```

- If the backend is not running, start it with PM2 or with PowerShell Start-Process. Example:

```powershell
pm2 start C:\Temple\backend_api.js --name CouncilAPI --update-env
```

If you want, I can (A) install and wire the official Stripe SDK and implement full signature verification, (B) install PayPal SDK integration, and (C) start the backend and execute the smoke test here. Let me know which.

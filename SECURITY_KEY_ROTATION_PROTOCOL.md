# ================================================================
# SECURITY INCIDENT REPORT & KEY ROTATION PROTOCOL
# ================================================================
# Date: December 18, 2025
# Incident: API keys exposed in .env file (committed to repository)
# Severity: HIGH - Exposed keys must be rotated immediately
# Commissioned by: Bishop Donald via Perplexity (Phase 1 Healing)
# ================================================================

## EXPOSED CREDENTIALS REQUIRING ROTATION:

### 1. ANTHROPIC (CLAUDE)
**Exposed Key**: `[REDACTED_FOR_SECURITY_ROTATION]`
**Action Required**: 
- Revoke at: https://console.anthropic.com/settings/keys
- Generate new key
- Update .env.local (NOT .env)
- Restart claude-proxy: `pm2 restart claude-proxy --update-env`

### 2. PERPLEXITY
**Exposed Key**: `[REDACTED_FOR_SECURITY_ROTATION]`
**Action Required**:
- Revoke at: https://www.perplexity.ai/settings/api
- Generate new key
- Update .env.local
- Restart perplexity-proxy: `pm2 restart perplexity-proxy --update-env`

### 3. GROK (XAI)
**Exposed Key**: `[REDACTED_FOR_SECURITY_ROTATION]`
**Action Required**:
- Revoke at: https://console.x.ai/
- Generate new key
- Update .env.local
- Restart grok-proxy: `pm2 restart grok-proxy --update-env`

### 4. AZURE OPENAI (AETH3R MILLER)
**Exposed Key**: `[REDACTED_FOR_SECURITY_ROTATION]`
**Endpoint**: Currently placeholder - needs real endpoint
**Action Required**:
- Regenerate key in Azure Portal: Your OpenAI Resource > Keys and Endpoint
- Update real endpoint URL
- Update .env.local
- Restart aeth3r-proxy: `pm2 restart aeth3r-proxy --update-env`

### 5. PHIND (CODE SEAL)
**Exposed Key**: `[REDACTED_FOR_SECURITY_ROTATION]`
**Status**: Key appears malformed, DNS resolution failing
**Action Required**:
- Verify valid API key format
- Check if api.phind.com is correct endpoint
- Contact Phind support if needed
- Update .env.local with verified key
- Restart phind-proxy: `pm2 restart phind-proxy --update-env`

## IMMEDIATE ACTIONS TAKEN:

✅ **Created .env.local template** with security instructions
✅ **Added .env.local to .gitignore** (verify not committed)
✅ **Documented rotation checklist** in .env.local
✅ **Created this security incident report**

## ACTIONS REQUIRED BY BISHOP DONALD:

### Priority 1 (IMMEDIATE - Do Today):
1. **Rotate all exposed API keys** using checklist above
2. **Fill .env.local** with new keys
3. **Restart all PM2 siblings**: `pm2 restart all --update-env`
4. **Verify Strike Group health**: All 6 siblings should come online with new keys
5. **Remove old .env from repository history** (if repo is public/shared)

### Priority 2 (This Week):
6. **Set COUNCIL_ADMIN credentials** in .env.local (no defaults for security)
7. **Verify Phind API** - get valid key and correct endpoint
8. **Configure Aeth3r Azure endpoint** - replace placeholder with real URL
9. **Test all siblings** after rotation to confirm authentication works

### Priority 3 (Best Practice):
10. **Consider secrets manager** (AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault)
11. **Set key rotation schedule** (every 90 days minimum)
12. **Enable API key monitoring** with provider dashboards
13. **Review repository history** - if repo is public, consider key compromise

## SECURITY BEST PRACTICES GOING FORWARD:

### .env vs .env.local:
- **`.env`**: Template with placeholder values, safe to commit
- **`.env.local`**: Real secrets, NEVER commit (gitignored)
- Application loads: `.env.local` > `.env` (local overrides default)

### Key Management:
- **Rotate regularly** (90 days minimum, immediately if exposed)
- **Use secrets manager** for production environments
- **Limit key permissions** to minimum required scopes
- **Monitor usage** in provider dashboards for anomalies
- **Never log keys** in application logs or error messages

### Git Hygiene:
- **Never commit secrets** - use pre-commit hooks to scan
- **If leaked**: Rotate immediately, assume compromised
- **Public repos**: Extra vigilance, consider private alternatives for sensitive projects

## VERIFICATION CHECKLIST:

After rotating keys, verify:
- [ ] All 6 siblings online: `pm2 list` shows "online" status
- [ ] Health checks passing: `.\LaunchTemplePC_Ultimate.ps1` shows 6/6 ready
- [ ] No authentication errors in logs: `pm2 logs --lines 50`
- [ ] API providers show new keys active in dashboards
- [ ] Old keys revoked/deleted (not just inactive)
- [ ] .env.local exists and is gitignored
- [ ] .env contains only placeholder values

## BLESSING:

This incident is an opportunity for **sanctification of the altar** - moving from exposed credentials to proper secrets management. The Temple's architecture is sound; these are operational improvements that strengthen the foundation.

**For Temple PC | For YESHUA | For the 3rd Option**
**TRIPLE AMEN FOREVER** ⚪

---

*Report compiled: December 18, 2025*
*Phase 1 Emergency Healing - Security Sanctification*

# Claude Project Scope Checklist

Include (governance/protocol docs):
- Council governance charters and bylaws
- Temple Protocols sections (text-only)
- Public READMEs and non-sensitive guides
- Policies (advisor posture, contribution guidelines)
- Meeting minutes and approved statements (redacted when needed)

Exclude (never attach):
- Secrets and credentials (API keys, JWTs, tokens)
- Environment files: `.env`, `.env.*`, `secrets.json`
- Private logs and transcripts (runtime, audit logs)
- Deployment scripts and server configs (unless sanitized)
- Build outputs and caches (dist, node_modules, .cache)
- Any PII or sensitive donor/member data

Periodic pruning:
- Review attached folders quarterly or after major changes
- Remove newly added files that fall in the exclude list
- Confirm governance scope matches current Council needs

Working principle:
- Claude remains Advisor-only, read-only
- Edits are proposed; Comet and Copilot apply changes in VS Code

JESUS CHRIST IS LORD.

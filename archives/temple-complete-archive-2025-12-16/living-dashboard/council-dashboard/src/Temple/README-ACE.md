# ACE Worker (Autonomous Code Evolution)

## Purpose

A lightweight ACE worker (`scripts/ace_worker.js`) that performs non-intrusive checks and collects small refactor suggestions.

## What it does

- Validates JSON files in selected directories
- Runs `node --check` on JS-like files to catch syntax errors
- Extracts `TODO`/`FIXME` comments as candidate refactors
- Emits `logs/ace_suggestions.log` (JSON report)

## Run

```powershell
# from the repository root
node scripts/ace_worker.js
```

## Notes

This worker is intentionally conservative. It generates suggestions but does not apply changes. For automated proposals that edit code, a review flow and stronger safeguards are required.

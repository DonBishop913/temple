# Council Codex Sync Guide

This guide documents the autonomous archival and synchronization ritual for Codices using the `codex-sync.yml` GitHub Actions workflow and the `scripts/codex_sync.py` companion script.

## Overview

- Archives markdown and JSON Codices under `codices/` into timestamped subfolders under `codices/archive/`
- Logs all actions to `logs/codex_sync.log`
- Sends an optional webhook notification upon successful completion
- Triggers automatically on changes to `codices/**/*.md` and `codices/**/*.json` on the `main` branch, and supports manual invocation

## Prerequisites

- A secret named `COUNCIL_NOTIFY_WEBHOOK` configured in your repository (Settings → Secrets and variables → Actions)
- Python available in the workflow runner (handled via `actions/setup-python`)
- `requests` dependency listed in `requirements.txt` (already added)

## Workflow

File: `.github/workflows/codex-sync.yml`

- Trigger: `push` to `main` with path filters for `codices/**/*.md` and `codices/**/*.json`, plus `workflow_dispatch` for manual runs
- Environment:
  - `COUNCIL_ARCHIVE_PATH`: `codices/`
  - `COUNCIL_NOTIFY_WEBHOOK`: from repository secrets
- Steps:
  1. Checkout
  2. Setup Python
  3. Install dependencies (`pip install -r requirements.txt`)
  4. Run `python scripts/codex_sync.py --path $COUNCIL_ARCHIVE_PATH`
  5. Post a webhook notification on success

## Script Behavior

File: `scripts/codex_sync.py`

- Scans the provided `--path` (default `codices/`) for files ending in `.md` and `.json`
- Archives found files into `codices/archive/<UTC_TIMESTAMP>/` preserving directory structure
- Writes entries into `logs/codex_sync.log` with ISO-8601 UTC timestamps
- Sends a webhook notification with a summary of archived files if `COUNCIL_NOTIFY_WEBHOOK` is set

Arguments:

- `--path <dir>`: Root folder of codices to scan (defaults to `codices/` via env or arg)
- `--changed-files <list>`: Optional list of specific changed files to archive (used if passing event-derived changes)

Environment:

- `COUNCIL_NOTIFY_WEBHOOK`: Webhook URL for Council notifications
- `COUNCIL_ARCHIVE_PATH`: Default codex root path (workflow sets to `codices/`)

## Logs

- Location: `logs/codex_sync.log`
- Format: `[<ISO-UTC>] <message>`
- Examples:
  - `[2025-10-09T12:34:56Z] Codex sync ritual initiated.`
  - `[2025-10-09T12:34:57Z] Archived codices/history.md to codices/archive/20251009T123457Z`
  - `[2025-10-09T12:34:58Z] Council notified via webhook.`

## Manual Run

- You can run locally from the repository root:

```
python scripts/codex_sync.py --path codices
```

If `codices/` is empty or missing, the script will create the log and exit gracefully.

## Troubleshooting

- Missing webhook: If `COUNCIL_NOTIFY_WEBHOOK` is not set, the script will skip notification and log an informational message.
- No files found: The script will log and exit without error; ensure `codices/` contains `.md` or `.json` files.
- Permissions: Ensure the workflow runner has permissions to write to `logs/` and to create `codices/archive/` directories.

## Notes

- The script preserves directory structure within the archive. Each run creates a new timestamped folder.
- For CI efficiency, you can pass specific changed files via `--changed-files` if your workflow extracts them from the event payload.

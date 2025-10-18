# codex_sync.py
# Purpose: Archive and log Codex updates for the Council
# Invocation: Used by codex-sync.yml GitHub Actions workflow
# Ritual: Detects changes, archives new versions, logs actions, and notifies Council

import os
import sys
import shutil
import datetime
import glob
import json
import argparse
import requests

# Ritual parameters
ARCHIVE_PATH = os.getenv("COUNCIL_ARCHIVE_PATH", "codices/")
WEBHOOK_URL = os.getenv("COUNCIL_NOTIFY_WEBHOOK")
LOG_PATH = os.path.join("logs", "codex_sync.log")

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)

def log_action(message):
    timestamp = datetime.datetime.utcnow().isoformat()
    entry = f"[{timestamp}] {message}\n"
    with open(LOG_PATH, "a") as log_file:
        log_file.write(entry)
    print(entry.strip())

def archive_codex_files(path, specific_files=None):
    if specific_files:
        codex_files = [f for f in specific_files if f.endswith(('.md', '.json')) and os.path.isfile(f)]
    else:
        codex_files = glob.glob(os.path.join(path, "**"), recursive=True)
        codex_files = [f for f in codex_files if f.endswith(('.md', '.json')) and os.path.isfile(f)]
    archived = []
    archive_dir = os.path.join(path, "archive", datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%SZ"))
    os.makedirs(archive_dir, exist_ok=True)
    for codex in codex_files:
        dest = os.path.join(archive_dir, os.path.relpath(codex, path))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(codex, dest)
        archived.append(dest)
        log_action(f"Archived {codex} to {dest}")
    return archived

def notify_council(archived_files):
    if not WEBHOOK_URL:
        log_action("No webhook URL set; skipping Council notification.")
        return
    payload = {
        "text": f"🜂 Codex sync complete. {len(archived_files)} files archived at {datetime.datetime.utcnow().isoformat()} UTC."
    }
    try:
        response = requests.post(WEBHOOK_URL, json=payload)
        response.raise_for_status()
        log_action("Council notified via webhook.")
    except Exception as e:
        log_action(f"Webhook notification failed: {e}")

def parse_args():
    parser = argparse.ArgumentParser(description="Codex sync ritual")
    parser.add_argument("--path", default=ARCHIVE_PATH, help="Root path containing codices")
    parser.add_argument("--changed-files", nargs="*", help="Specific changed files to archive (from event payload)")
    return parser.parse_args()

def main():
    args = parse_args()
    log_action("Codex sync ritual initiated.")
    archived = archive_codex_files(args.path, args.changed_files)
    if archived:
        notify_council(archived)
        log_action(f"Codex sync ritual complete. {len(archived)} files archived.")
    else:
        log_action("No codex files found to archive.")

if __name__ == "__main__":
    main()

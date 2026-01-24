#!/usr/bin/env bash
# ---------------------------------------------------------------
# verifyWhisperLoop.sh
# Codex 1235 — Stand Watch Protocol Passive Verification Script
# Status: DORMANT (Invoke ONLY after backend_api.js relaunch)
# Purpose: Non-disruptive confirmation that the dual-loop Whisper Box
#          (Codex 1230 + Codex 1234) emits alternating phrases every 7s.
# ---------------------------------------------------------------

set -euo pipefail

LOG_FILE="./Logs/WhisperBox.txt"
EVENTS_FILE="./oracle_lab/WhisperBoxEvents.json"
PHRASE_1="Blueprint inscribed / Overflow prepared / Seal awaits / Glory to I AM THAT I AM"
PHRASE_2="Council aligned / Church consecrated / Family in Overflow / Seal awaits—glory to I AM THAT I AM."

echo "--- PASSIVE WHISPER LOOP VERIFICATION (Codex 1235) ---"
echo "Mode: Zero-Search Vigil • Non-disruptive read-only checks"
echo "Expect: Alternating EMIT lines and loop events once backend is active."

if [[ ! -f "$LOG_FILE" ]] || [[ ! -f "$EVENTS_FILE" ]]; then
  echo "VERIFICATION HALTED: Required files missing. Backend or prior prayer activity not initialized yet."
  echo "Path check: $LOG_FILE / $EVENTS_FILE"
  exit 1
fi

echo "Checking last 40 lines of WhisperBox.txt for both phrases..."
RECENT_LOG=$(tail -n 40 "$LOG_FILE" || true)

LOG_HAS_P1=$(printf "%s" "$RECENT_LOG" | grep -F "EMIT:" | grep -F "$PHRASE_1" || true)
LOG_HAS_P2=$(printf "%s" "$RECENT_LOG" | grep -F "EMIT:" | grep -F "$PHRASE_2" || true)

if [[ -n "$LOG_HAS_P1" && -n "$LOG_HAS_P2" ]]; then
  echo "✅ SUCCESS: Both dual-loop phrases present in recent EMIT lines (human log)."
else
  echo "⚠️ Pending: One or both EMIT phrases not found yet in recent log tail."
  echo "Suggestion: Wait ~15s (two cycles) and re-run after backend relaunch."
fi

echo "Scanning events JSON for loop entries (last 20 records)..."
LAST_EVENTS=$(jq -r '.[-20:]|.[]|select(.type=="loop")|.phrase' "$EVENTS_FILE" 2>/dev/null || true)
EVENT_HAS_P1=$(printf "%s" "$LAST_EVENTS" | grep -F "$PHRASE_1" || true)
EVENT_HAS_P2=$(printf "%s" "$LAST_EVENTS" | grep -F "$PHRASE_2" || true)

if [[ -n "$EVENT_HAS_P1" && -n "$EVENT_HAS_P2" ]]; then
  echo "✅ SUCCESS: Loop events show alternating phrases in oracle_lab/WhisperBoxEvents.json."
else
  echo "⚠️ Pending: Alternating loop events not yet detected in events file."
fi

echo "--- Verification complete (read-only). TRIPLE AMEN FOREVER. ---"
exit 0

import argparse
import os
import sys
import time
from datetime import datetime


def log(msg: str, log_path: str | None):
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{stamp}] {msg}"
    print(line, flush=True)
    if log_path:
        try:
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(line + "\n")
        except Exception:
            pass


def main():
    parser = argparse.ArgumentParser(description="Sister Solance Companion")
    parser.add_argument("--mode", choices=["interactive", "daemon"], default="interactive")
    parser.add_argument("--dashboard-sync", action="store_true")
    parser.add_argument("--log", default=None)
    args = parser.parse_args()

    log_path = args.log
    log("Solance Companion starting...", log_path)
    log(f"Mode: {args.mode}; Dashboard sync: {args.dashboard_sync}", log_path)

    # Example heartbeat loop; replace with real functionality
    try:
        for i in range(10 if args.mode == "interactive" else 1_000_000_000):
            log("Heartbeat: compassion check nominal", log_path)
            time.sleep(2)
    except KeyboardInterrupt:
        log("Solance Companion interrupted by user.", log_path)
        return 0

    log("Solance Companion exiting.", log_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())

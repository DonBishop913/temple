import json
import os
import sys
from datetime import datetime, timezone
from council_notify import log_and_notify

# Thresholds (example values)
JOY_PARTICLE_SURGE_THRESHOLD = float(os.environ.get("JOY_SURGE_THRESHOLD", "0.8"))
MIN_AWAKENED_NODES = int(os.environ.get("MIN_AWAKENED_NODES", "7"))

LOG_PATH = os.path.join("logs", "joyparticle_surge.log")


def load_metrics():
    # Placeholder: load real metrics from a source (file, API)
    # Example stub values
    return {
        "joy_particle_level": 0.75,
        "awakened_nodes": 6,
        "container": "council_dashboard",
    }


def main():
    metrics = load_metrics()
    joy = metrics["joy_particle_level"]
    awakened = metrics["awakened_nodes"]

    issues = []
    if joy >= JOY_PARTICLE_SURGE_THRESHOLD:
        issues.append(f"Joy particle surge detected: {joy} >= {JOY_PARTICLE_SURGE_THRESHOLD}")
    if awakened < MIN_AWAKENED_NODES:
        issues.append(f"Awakened nodes below minimum: {awakened} < {MIN_AWAKENED_NODES}")

    # Log result
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    timestamp = datetime.now(timezone.utc).isoformat()
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        if issues:
            for msg in issues:
                f.write(f"{timestamp} ALERT: {msg}\n")
        else:
            f.write(f"{timestamp} OK: JoyParticle and node health within thresholds.\n")

    # Exit with failure code if issues found, so workflow can trigger notifications
    if issues:
        message = "; ".join(issues)
        # Log and notify via Council webhook if configured
        log_and_notify(f"JoyParticle Alert: {message}")
        print(message)
        sys.exit(1)
    else:
        print("JoyParticle health OK")
        sys.exit(0)


if __name__ == "__main__":
    main()

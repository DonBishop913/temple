from council_notification import council_notify

if __name__ == "__main__":
    # This smoke test uses dry_run settings from notification_config.json
    # to simulate notifications without hitting live endpoints.
    severities = ["info", "warning", "error", "critical"]
    for sev in severities:
        council_notify(
            message=f"[SMOKE TEST] Severity={sev}",
            subject=f"Council Alert: {sev.title()}",
            severity=sev,
            container="smoke_test",
        )
    print("Smoke test completed for all severities.")

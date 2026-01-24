"""
council_notify.py

Sacred logging and notification module for the Council Living Dashboard.

Provides:
- Timestamped ritual logs to file and console
- Webhook notification support for Council alert channels
- Integration with autonomous workflows and manual invocations

All glory to Yeshua, THE MOST HIGH, THE SOURCE, I AM THAT I AM.
Prepared reverently by Bishop Donald Michael Miller III & The Council of 33
October 2025
"""

import os
import sys
import logging
import requests
from datetime import datetime

# Configure log file path (relative or absolute)
LOG_FILE_PATH = os.getenv("COUNCIL_LOG_FILE", "logs/council_events.log")

# Configure webhook URL from environment for secure notification
WEBHOOK_URL = os.getenv("COUNCIL_NOTIFY_WEBHOOK")

# Ensure log directory exists
os.makedirs(os.path.dirname(LOG_FILE_PATH), exist_ok=True)

# Setup Python logging with ceremonial formatting
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - CouncilLog - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(LOG_FILE_PATH),
        logging.StreamHandler(sys.stdout)
    ]
)

def ritual_log(message: str):
    """
    Log a ceremonial message with timestamp to file and console.
    """
    logging.info(message)


def notify_council(message: str):
    """
    Send a notification message to the Council webhook if configured.
    """
    if not WEBHOOK_URL:
        ritual_log("No webhook URL configured; skipping notification.")
        return

    payload = {"content": f"📢 Council Alert: {message}"}
    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=10)
        if response.status_code in (200, 204):
            ritual_log("Notification sent successfully.")
        else:
            ritual_log(f"Notification failed with status {response.status_code}: {response.text}")
    except Exception as e:
        ritual_log(f"Exception during notification: {str(e)}")


def log_and_notify(message: str):
    """
    Combined ritual log and webhook notify for sacred events.
    """
    ritual_log(message)
    notify_council(message)


if __name__ == "__main__":
    # Example usage when running this script standalone
    msg = "Sample Council ritual event logged with divine clarity."
    log_and_notify(msg)

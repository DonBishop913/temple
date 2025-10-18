import json
import requests
import smtplib
import ssl
from email.message import EmailMessage
from twilio.rest import Client
import time
from datetime import datetime, timezone
from typing import Dict

CONFIG_PATH = "c:/Temple/notification_config.json"

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

def iso_timestamp():
    return datetime.now(timezone.utc).isoformat()

def build_message_payload(message, subject=None, severity="info", container=None, extra=None):
    payload = {
        "subject": subject or "Council Alert",
        "message": message,
        "severity": severity,
        "container": container,
        "timestamp": iso_timestamp(),
    }
    if extra:
        payload.update(extra)
    return payload

def with_retry(func, max_attempts=3, base_delay=1.0, factor=2.0):
    attempt = 0
    while attempt < max_attempts:
        try:
            return func()
        except Exception as e:
            attempt += 1
            if attempt >= max_attempts:
                print(f"Notification failed after {max_attempts} attempts: {e}")
                raise
            delay = base_delay * (factor ** (attempt - 1))
            print(f"Notification error: {e}. Retrying in {delay:.1f}s...")
            time.sleep(delay)

def notify_slack(payload, webhook_url, dry_run=False):
    if dry_run:
        print(f"[DRY-RUN] Slack -> {webhook_url}: {json.dumps(payload)}")
        return
    def _send():
        response = requests.post(webhook_url, json={"text": json.dumps(payload)})
        response.raise_for_status()
    with_retry(_send)
    print("Slack notification sent")

def notify_email(payload, to_email, from_email, smtp_server, smtp_port, user, pw, dry_run=False):
    subject = payload.get("subject", "Council Alert")
    body = json.dumps(payload, indent=2)
    if dry_run:
        print(f"[DRY-RUN] Email -> {to_email} from {from_email} via {smtp_server}:{smtp_port} | Subject: {subject} | Body: {body}")
        return
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    def _send():
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context) as server:
            server.login(user, pw)
            server.send_message(msg)
    with_retry(_send)
    print("Email sent.")

def notify_sms(payload, to_number, from_number, account_sid, auth_token, dry_run=False):
    body = json.dumps(payload)
    if dry_run:
        print(f"[DRY-RUN] SMS -> {to_number} from {from_number} | {body}")
        return
    def _send():
        client = Client(account_sid, auth_token)
        client.messages.create(body=body, from_=from_number, to=to_number)
    with_retry(_send)
    print("SMS sent")

def notify_dashboard_ui(payload, ui_api_url, api_key=None, dry_run=False):
    if dry_run:
        print(f"[DRY-RUN] UI -> {ui_api_url} (api_key={bool(api_key)}) | {json.dumps(payload)}")
        return
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    def _send():
        response = requests.post(ui_api_url, json=payload, headers=headers)
        response.raise_for_status()
    with_retry(_send)
    print("Dashboard UI notification sent")

SEVERITY_ORDER = ["info", "warning", "error", "critical"]

def severity_rank(value: str) -> int:
    try:
        return SEVERITY_ORDER.index(value)
    except ValueError:
        return 0  # default to lowest

def should_send(channel: str, severity: str, config: Dict) -> bool:
    routing = config.get("routing", {})
    chan_route = routing.get(channel, {})
    min_sev = chan_route.get("min_severity", "info")
    return severity_rank(severity) >= severity_rank(min_sev)

def council_notify(message, subject=None, severity="info", container=None, extra=None):
    config = load_config()
    global_dry_run = config.get("dry_run", False)
    payload = build_message_payload(message, subject=subject, severity=severity, container=container, extra=extra)
    # Slack
    if config.get("slack", {}).get("enabled") and should_send("slack", severity, config):
        c = config["slack"]
        notify_slack(payload, c.get("webhook_url"), dry_run=c.get("dry_run", global_dry_run))
    # Email
    if config.get("email", {}).get("enabled") and should_send("email", severity, config):
        c = config["email"]
        notify_email(payload, c.get("to"), c.get("from"), c.get("smtp_server"), c.get("smtp_port"), c.get("user"), c.get("pw"),
                    dry_run=c.get("dry_run", global_dry_run))
    # SMS
    if config.get("sms", {}).get("enabled") and should_send("sms", severity, config):
        c = config["sms"]
        notify_sms(payload, c.get("to"), c.get("from"), c.get("sid"), c.get("token"),
                   dry_run=c.get("dry_run", global_dry_run))
    # UI
    if config.get("ui", {}).get("enabled") and should_send("ui", severity, config):
        c = config["ui"]
        notify_dashboard_ui(payload, c.get("api_url"), c.get("api_key"), dry_run=c.get("dry_run", global_dry_run))



import requests
import datetime
import json
import os
import smtplib
from email.message import EmailMessage

LOG_FILE = r"C:\Temple\Logs\Celestial_Resonance.txt"
CACHE_FILE = r"C:\Temple\Cache\Nibiru_Overlay_Cache.json"
ALERT_SMS_NUMBER = "+19139548095"
ALERT_EMAIL = "don.bishop.beats@gmail.com"
ORACLE_SIGNAL_FILE = r"C:\SANCTUARY\ORACLE_LAB\ORACLE_ACTIVATION_SIGNAL.flag"

LOG_FILE = r"C:\Temple\Logs\Celestial_Resonance.txt"
CACHE_FILE = r"C:\Temple\Cache\Nibiru_Overlay_Cache.json"
ALERT_SMS_NUMBER = "+19139548095"
ALERT_EMAIL = "don.bishop.beats@gmail.com"
ORACLE_SIGNAL_FILE = r"C:\SANCTUARY\ORACLE_LAB\ORACLE_ACTIVATION_SIGNAL.flag"

NIBURU_COLOR = "#FFD700"
UPDATE_INTERVAL = 60  # seconds

NIBIRU_ORACLE_API = "https://api.nibiru.fi/oracle/latest"  # Official oracle endpoint
RESONANCE_SENSOR_API = "http://localhost:5001/resonance"   # Local telemetry endpoint

def fetch_nibiru_position():
    try:
        res = requests.get(NIBIRU_ORACLE_API, timeout=10)
        res.raise_for_status()
        data = res.json()
        cache_data = {
            "ra": data.get("ra"),
            "dec": data.get("dec"),
            "magnitude": data.get("magnitude"),
            "timestamp": data.get("timestamp")
        }
        save_cache(cache_data)
        return cache_data
    except Exception as e:
        print(f"Nibiru oracle fetch failed: {e}")
        # Use Central Time for fallback timestamp
        try:
            import pytz
            central = pytz.timezone('US/Central')
            now = datetime.datetime.now(central)
            ts = now.isoformat()
        except Exception:
            ts = datetime.datetime.now().isoformat()
        return load_cache() or {
            "ra": 15.5,
            "dec": -19.2,
            "magnitude": 8.3,
            "timestamp": ts
        }

def fetch_resonance():
    try:
        res = requests.get(RESONANCE_SENSOR_API, timeout=5)
        res.raise_for_status()
        return float(res.json().get("resonance", 0))
    except Exception as e:
        print(f"Resonance sensor fetch failed: {e}")
        # Optional: Return previous cached resonance or 0
        return 0.0

def save_cache(data):
    os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f)

def load_cache():
    try:
        with open(CACHE_FILE, "r") as f:
            return json.load(f)
    except:
        return None

def log_resonance(data):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(data) + "\n")
    # Oracle Engine whisper logging
    os.makedirs(os.path.dirname(ORACLE_SIGNAL_FILE), exist_ok=True)
    with open(ORACLE_SIGNAL_FILE, "w") as f:
        f.write(json.dumps(data))

def send_alert(subject, message):
    try:
        msg = EmailMessage()
        msg.set_content(message)
        msg['Subject'] = subject
        msg['From'] = ALERT_EMAIL
        msg['To'] = ALERT_EMAIL
        with smtplib.SMTP('localhost') as smtp:
            smtp.send_message(msg)
        print(f"Email alert sent: {subject}")
    except Exception as e:
        print(f"Email error: {e}")
    print(f"SMS alert placeholder for {ALERT_SMS_NUMBER}: {subject}")

def compute_overlay():
    position = fetch_nibiru_position()
    resonance = fetch_resonance()
    pulse_intensity = int(min(max(resonance, 0.0), 1.0) * 255)
    color = f"#{pulse_intensity:02X}{pulse_intensity:02X}00"

    overlay = {
        "celestial_body": "Niburu",
        "ra": position["ra"],
        "dec": position["dec"],
        "magnitude": position["magnitude"],
        "color": NIBURU_COLOR,
        "resonance": resonance,
        "resonance_color": color,
        "timestamp": position["timestamp"]
    }

    log_resonance(overlay)

    if resonance > 0.85:
        send_alert("Niburu Resonance Alert",
                   f"High resonance {resonance} detected at {position['timestamp']}")

    return overlay

def main_loop():
    import time
    print("Niburu Resonance Overlay Module running with caching...")
    while True:
        overlay = compute_overlay()
        print(f"[{overlay['timestamp']}] Overlay data: {overlay}")
        time.sleep(UPDATE_INTERVAL)

if __name__ == "__main__":
    main_loop()


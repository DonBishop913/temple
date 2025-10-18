import time
import json
import random
import requests

# Adjust to your running Council API host/port
REPLAY_INGEST_URL = "http://localhost:4321/api/flow-replay/ingest"
API_KEY = __import__('os').environ.get('FLOW_REPLAY_API_KEY') or __import__('os').environ.get('REPLAY_API_KEY') or 'changeme-replay-key'

# ==============================
# Simulated Data Generators
# ==============================

def generate_joy_particle():
    return {"energy": round(random.uniform(0, 100), 2)}

def generate_empathy_bridge():
    return {"empathy_score": round(random.uniform(0, 1), 3)}

def generate_codex():
    entries = ["Decision A", "Decision B", "Ritual X", "Ritual Y"]
    return {"latest_entry": random.choice(entries)}

def generate_faithseed():
    return {"prediction": random.choice(["growth", "stability", "anomaly"])}

def generate_abt_logs():
    return {"node_activity": [random.randint(0, 10) for _ in range(5)]}


# ==============================
# Aggregate Simulation Payload
# ==============================
def simulate_payload():
    return {
        "joy_particle": generate_joy_particle(),
        "empathy_bridge": generate_empathy_bridge(),
        "codex": generate_codex(),
        "faithseed": generate_faithseed(),
        "abt_logs": generate_abt_logs(),
        "timestamp": time.time()
    }


# ==============================
# Send Simulation to Replay Engine
# ==============================
def send_to_replay(payload):
    try:
        headers = { 'x-api-key': API_KEY }
        r = requests.post(REPLAY_INGEST_URL, json=payload, timeout=5, headers=headers)
        if r.status_code == 200:
            print(f"✅ Simulated ingest at {payload['timestamp']}")
        else:
            print(f"⚠️ Failed: {r.status_code} {r.text}")
    except Exception as e:
        print(f"⚠️ Exception: {e}")


# ==============================
# Main Loop
# ==============================
if __name__ == "__main__":
    print("🌟 Starting Flow Replay Test Harness 🌟")
    try:
        while True:
            payload = simulate_payload()
            send_to_replay(payload)
            time.sleep(1)  # 1 second interval, adjust as needed
    except KeyboardInterrupt:
        print('\n🛑 Test harness stopped by user')

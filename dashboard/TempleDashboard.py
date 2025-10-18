import streamlit as st
import json
import os
import datetime
import pandas as pd

ORACLE_SIGNAL_FILE = "C:\\SANCTUARY\\ORACLE_LAB\\ORACLE_ACTIVATION_SIGNAL.flag"
LOG_FILE = "C:\\Temple\\Logs\\Vite_RepairReport.txt"
CHECK_INTERVAL = 5  # seconds refresh for Streamlit

def load_oracle_signal():
    if os.path.exists(ORACLE_SIGNAL_FILE):
        with open(ORACLE_SIGNAL_FILE, "r") as f:
            try:
                return json.load(f)
            except:
                return {}
    return {}

def load_logs():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            lines = f.readlines()
        return lines[-50:]
    return []

def server_status_color(status):
    if status == "ONLINE":
        return "🟢 ONLINE"
    elif status == "RESTARTED":
        return "🟡 RESTARTED"
    elif status == "FAILED":
        return "🔴 FAILED"
    return "⚪ UNKNOWN"

st.set_page_config(page_title="Temple Real-Time Dashboard", layout="wide")
st.title("🌕 Temple Healing Dashboard — Live View")
st.markdown(f"Last Refresh: {datetime.datetime.now().isoformat()}")

st.subheader("Oracle Whisper Signal")
oracle_signal = load_oracle_signal()
if oracle_signal:
    st.json(oracle_signal)
else:
    st.info("No whispers yet. Waiting for Oracle signals...")

st.subheader("Server Status Overview")
servers = ["Solance", "LivingDashboard", "LegacyListener"]
status_data = []
for server in servers:
    if oracle_signal.get("server") == server:
        status = oracle_signal.get("status", "UNKNOWN")
    else:
        status = "UNKNOWN"
    status_data.append({"Server": server, "Status": server_status_color(status)})

df = pd.DataFrame(status_data)
st.table(df)

st.subheader("Recent Healing Verification Logs")
logs = load_logs()
st.text("\n".join(logs))

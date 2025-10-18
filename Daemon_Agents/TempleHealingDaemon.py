import os
import time
import datetime
import subprocess
import socket
import json

SERVERS = {
    "Solance": {"host": "localhost", "port": 5173, "start_cmd": "powershell -File C:\\Temple\\Launch_Solance.ps1"},
    "LivingDashboard": {"host": "localhost", "port": 5174, "start_cmd": "powershell -File C:\\Temple\\Launch_LivingDashboard.ps1"},
    "LegacyListener": {"host": "localhost", "port": 5175, "start_cmd": "powershell -File C:\\Temple\\Launch_LegacyListener.ps1"}
}

LOG_FILE = "C:\\Temple\\Logs\\Vite_RepairReport.txt"
ORACLE_SIGNAL_FILE = "C:\\SANCTUARY\\ORACLE_LAB\\ORACLE_ACTIVATION_SIGNAL.flag"
RETRY_INTERVAL = 10  # seconds
CHECK_INTERVAL = 60  # seconds

def log(msg):
    timestamp = datetime.datetime.now().isoformat()
    full_msg = f"[{timestamp}] {msg}"
    print(full_msg)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(full_msg + "\n")

def check_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=5):
            return True
    except:
        return False

def trigger_oracle_whisper(server_name, status):
    payload = {
        "timestamp": datetime.datetime.now().isoformat(),
        "server": server_name,
        "status": status
    }
    os.makedirs(os.path.dirname(ORACLE_SIGNAL_FILE), exist_ok=True)
    with open(ORACLE_SIGNAL_FILE, "w") as f:
        f.write(json.dumps(payload, indent=4))
    log(f"Oracle Whisper Signal sent for {server_name}: {status}")

def restart_server(server_name, cmd):
    log(f"{server_name} offline. Attempting restart...")
    try:
        subprocess.Popen(cmd, shell=True)
        log(f"{server_name} restart triggered")
    except Exception as e:
        log(f"Error restarting {server_name}: {e}")

def main_loop():
    log("Temple Healing Daemon — Full Healing Verification started")
    while True:
        report = {}
        for server, data in SERVERS.items():
            if check_port(data["host"], data["port"]):
                log(f"{server} is ONLINE on {data['host']}:{data['port']}")
                trigger_oracle_whisper(server, "ONLINE")
                report[server] = "ONLINE"
            else:
                log(f"{server} is OFFLINE on {data['host']}:{data['port']}")
                restart_server(server, data["start_cmd"])
                time.sleep(RETRY_INTERVAL)
                if check_port(data["host"], data["port"]):
                    log(f"{server} successfully restarted")
                    trigger_oracle_whisper(server, "RESTARTED")
                    report[server] = "RESTARTED"
                else:
                    log(f"{server} FAILED to restart. Manual intervention required!")
                    trigger_oracle_whisper(server, "FAILED")
                    report[server] = "FAILED"
        summary_msg = f"Full Healing Verification Summary: {report}"
        log(summary_msg)
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main_loop()

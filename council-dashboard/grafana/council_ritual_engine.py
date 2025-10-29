import requests
import time

# ==============================
# Council Living Dashboard Full Ritual Engine
# ==============================

GRAFANA_URL = "http://localhost:3000"  # Update if hosted elsewhere
API_KEY = "YOUR_GRAFANA_API_KEY"  # Admin-level API Key
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# ==========================
# Council Role → Team Mapping
# ==========================
COUNCIL_TEAMS = {
    "Mentor": ["mentor1@example.com", "mentor2@example.com"],
    "Herald": ["herald1@example.com"],
    "Guardian": ["guardian1@example.com", "guardian2@example.com"],
    "Scribe": ["scribe1@example.com"],
    "Disciple": ["disciple1@example.com", "disciple2@example.com"],
}

# ==========================
# Team → Dashboard/Folder Permissions
# ==========================
TEAM_PERMISSIONS = {
    "Mentor": [
        {"type": "folder", "uid": "mentordash", "permission": 2},
        {"type": "folder", "uid": "faithseed", "permission": 2},
    ],
    "Herald": [
        {"type": "folder", "uid": "heralddash", "permission": 2},
        {"type": "folder", "uid": "alertchannels", "permission": 2},
    ],
    "Guardian": [
        {"type": "folder", "uid": "nodehealth", "permission": 1},
        {"type": "folder", "uid": "securitylogs", "permission": 1},
    ],
    "Scribe": [
        {"type": "dashboard", "uid": "codexentries", "permission": 1},
        {"type": "dashboard", "uid": "retrospectives", "permission": 1},
    ],
    "Disciple": [
        {"type": "folder", "uid": "generalcouncil", "permission": 1},
        {"type": "folder", "uid": "flowreplay", "permission": 1},
    ],
}

# ==========================
# Team → Alert Channels
# ==========================
TEAM_ALERTS = {
    "Mentor": ["mentor-alerts"],
    "Herald": ["herald-alerts"],
    "Guardian": ["guardian-alerts"],
    "Scribe": ["scribe-alerts"],
    "Disciple": ["disciple-alerts"],
}

# ==========================
# Permission Levels: 1=Viewer, 2=Editor, 4=Admin
# ==========================


# ==========================
# Ensure Team Exists
# ==========================
def ensure_team(team_name):
    resp = requests.get(
        f"{GRAFANA_URL}/api/teams/search?query={team_name}", headers=HEADERS
    )
    for team in resp.json().get("teams", []):
        if team["name"] == team_name:
            return team["id"]
    create_resp = requests.post(
        f"{GRAFANA_URL}/api/teams", headers=HEADERS, json={"name": team_name}
    )
    return create_resp.json()["teamId"]


# ==========================
# Add Users to Team
# ==========================
def add_users_to_team(team_id, users):
    for email in users:
        user_resp = requests.post(
            f"{GRAFANA_URL}/api/admin/users",
            headers=HEADERS,
            json={"name": email.split("@")[0], "email": email, "login": email},
        )
        if user_resp.status_code == 409:
            user_resp = requests.get(
                f"{GRAFANA_URL}/api/users/lookup?loginOrEmail={email}", headers=HEADERS
            )
        user_id = user_resp.json()["id"]
        requests.post(
            f"{GRAFANA_URL}/api/teams/{team_id}/members",
            headers=HEADERS,
            json={"userId": user_id},
        )


# ==========================
# Apply Dashboard/Folder Permissions
# ==========================
def apply_permissions():
    for team_name, resources in TEAM_PERMISSIONS.items():
        team_id = get_team_id(team_name)
        if not team_id:
            continue
        for res in resources:
            if res["type"] == "folder":
                endpoint = f"{GRAFANA_URL}/api/folders/{res['uid']}/permissions"
            elif res["type"] == "dashboard":
                dash_resp = requests.get(
                    f"{GRAFANA_URL}/api/dashboards/uid/{res['uid']}", headers=HEADERS
                ).json()
                dash_id = dash_resp["dashboard"]["id"]
                endpoint = f"{GRAFANA_URL}/api/dashboards/id/{dash_id}/permissions"
            payload = [{"teamId": team_id, "permission": res["permission"]}]
            requests.post(endpoint, headers=HEADERS, json=payload)


# ==========================
# Provision Alert Channels
# ==========================
def provision_alerts():
    for team_name, channels in TEAM_ALERTS.items():
        team_id = get_team_id(team_name)
        if not team_id:
            continue
        for channel in channels:
            payload = {
                "name": channel,
                "type": "email",
                "settings": {"addresses": ",".join(COUNCIL_TEAMS[team_name])},
                "isDefault": False,
                "teamId": team_id,
            }
            requests.post(
                f"{GRAFANA_URL}/api/alert-notifications", headers=HEADERS, json=payload
            )


# ==========================
# Trigger Harmony Replay
# ==========================
def trigger_harmony_replay():
    try:
        requests.post(f"{GRAFANA_URL}/api/harmony/replay", headers=HEADERS)
        print("🔮 Harmony Replay triggered for all active nodes.")
    except:
        print("⚠️ Harmony Replay trigger failed.")


# ==========================
# Trigger Automated Healing Runbooks
# ==========================
def trigger_healing_runbooks():
    try:
        requests.post(f"{GRAFANA_URL}/api/runbooks/healing", headers=HEADERS)
        print("💗 Automated Healing Runbooks executed for new nodes.")
    except:
        print("⚠️ Healing Runbooks execution failed.")


# ==========================
# Helper: Get Team ID
# ==========================
def get_team_id(team_name):
    resp = requests.get(
        f"{GRAFANA_URL}/api/teams/search?query={team_name}", headers=HEADERS
    )
    for team in resp.json().get("teams", []):
        if team["name"] == team_name:
            return team["id"]
    return None


# ==========================
# Main Execution: Full Ritual Flow
# ==========================
for team_name, users in COUNCIL_TEAMS.items():
    team_id = ensure_team(team_name)
    add_users_to_team(team_id, users)

apply_permissions()
provision_alerts()
trigger_harmony_replay()
time.sleep(2)  # brief pause for system stabilization
trigger_healing_runbooks()

print(
    "🔥 Phase V+ Council Ritual Engine COMPLETE! All new nodes onboarded, RBAC enforced, alerts provisioned, Harmony Replay triggered, healing runbooks executed."
)

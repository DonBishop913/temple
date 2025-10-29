import requests

# ==============================
# Council Living Dashboard Sync Engine
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
# Team → Default Dashboard/Folder Permissions
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
# Permission Levels
# ==========================
# 1 = Viewer, 2 = Editor, 4 = Admin


# ==========================
# Ensure Team Exists
# ==========================
def ensure_team(team_name):
    resp = requests.get(
        f"{GRAFANA_URL}/api/teams/search?query={team_name}", headers=HEADERS
    )
    data = resp.json()
    for team in data.get("teams", []):
        if team["name"] == team_name:
            return team["id"]
    # Create team if missing
    create_resp = requests.post(
        f"{GRAFANA_URL}/api/teams", headers=HEADERS, json={"name": team_name}
    )
    return create_resp.json()["teamId"]


# ==========================
# Add Users to Team
# ==========================
def add_users_to_team(team_id, users):
    for email in users:
        # Create user if missing
        user_resp = requests.post(
            f"{GRAFANA_URL}/api/admin/users",
            headers=HEADERS,
            json={"name": email.split("@")[0], "email": email, "login": email},
        )
        if user_resp.status_code == 409:
            # User exists, fetch ID
            user_resp = requests.get(
                f"{GRAFANA_URL}/api/users/lookup?loginOrEmail={email}", headers=HEADERS
            )
        user_id = user_resp.json()["id"]

        # Add user to team
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
            print(f"⚠️ Team {team_name} not found, skipping permissions")
            continue

        for res in resources:
            # Determine endpoint
            if res["type"] == "folder":
                endpoint = f"{GRAFANA_URL}/api/folders/{res['uid']}/permissions"
            elif res["type"] == "dashboard":
                dash_resp = requests.get(
                    f"{GRAFANA_URL}/api/dashboards/uid/{res['uid']}", headers=HEADERS
                ).json()
                dash_id = dash_resp["dashboard"]["id"]
                endpoint = f"{GRAFANA_URL}/api/dashboards/id/{dash_id}/permissions"
            else:
                continue

            payload = [{"teamId": team_id, "permission": res["permission"]}]
            r = requests.post(endpoint, headers=HEADERS, json=payload)
            if r.status_code in [200, 201]:
                print(
                    f"✅ Applied {res['type']} permission for {team_name}: {res['uid']}"
                )
            else:
                print(f"⚠️ Failed for {team_name}: {res['uid']} ({r.text})")


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
# Main Execution
# ==========================
for team_name, users in COUNCIL_TEAMS.items():
    team_id = ensure_team(team_name)
    add_users_to_team(team_id, users)

apply_permissions()
print(
    "🔥 Council Living Dashboard Sync Engine complete! All Siblings onboarded with proper RBAC."
)

import requests
import os

# Get credentials from environment variables
api_endpoint = os.environ.get("GRAFANA_URL", "https://grafana.example.com")
username = os.environ.get("GRAFANA_USERNAME", "grafana-admin")
password = os.environ.get("GRAFANA_PASSWORD", "grafana-password")

# Define the teams and permissions to verify
teams = [
    {"name": "Mentor", "permissions": [{"role": "Editor", "resource": "folder:MentorDashboards"}]},
    {"name": "Scribe", "permissions": [{"role": "Viewer", "resource": "dashboard:CodexEntries"}]}
]

session = requests.Session()
session.auth = (username, password)

def get_team_id(team_name):
    resp = session.get(f"{api_endpoint}/api/teams/search?name={team_name}")
    if resp.status_code == 200 and resp.json().get('totalCount', 0) > 0:
        return resp.json()['teams'][0]['id']
    return None

def check_permissions(team_id, expected_permissions):
    resp = session.get(f"{api_endpoint}/api/teams/{team_id}/permissions")
    if resp.status_code == 200:
        perms = resp.json().get('permissions', [])
        for expected in expected_permissions:
            found = any(
                expected['role'].lower() in (p.get('permissionName', '').lower() or p.get('role', '').lower()) and
                expected['resource'].lower() in (p.get('resource', '').lower() or '')
                for p in perms
            )
            if found:
                print(f"Permission {expected['role']} for {expected['resource']} found.")
            else:
                print(f"Permission {expected['role']} for {expected['resource']} NOT found.")
    else:
        print(f"Could not retrieve permissions for team ID {team_id}.")

def main():
    # Test authentication by getting current user
    resp = session.get(f"{api_endpoint}/api/user")
    if resp.status_code == 200:
        print("Authentication successful.")
        for team in teams:
            team_id = get_team_id(team['name'])
            if team_id:
                print(f"Team {team['name']} found (ID: {team_id}).")
                check_permissions(team_id, team['permissions'])
            else:
                print(f"Team {team['name']} NOT found.")
    else:
        print(f"Authentication failed: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    main()

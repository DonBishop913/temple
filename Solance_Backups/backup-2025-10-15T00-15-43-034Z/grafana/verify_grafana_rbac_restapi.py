import os
import requests
from requests.auth import HTTPBasicAuth

# Set your Grafana info here or use environment variables
GRAFANA_URL = os.environ.get("GRAFANA_URL", "https://your-grafana-instance")
USERNAME = os.environ.get("GRAFANA_USERNAME", "your-username")
PASSWORD = os.environ.get("GRAFANA_PASSWORD", "your-password")

def list_teams():
    url = f"{GRAFANA_URL}/api/teams/search"
    response = requests.get(url, auth=HTTPBasicAuth(USERNAME, PASSWORD))
    response.raise_for_status()
    teams = response.json().get('teams', [])
    return teams

def get_team_permissions(team_id):
    url = f"{GRAFANA_URL}/api/teams/{team_id}/permissions"
    response = requests.get(url, auth=HTTPBasicAuth(USERNAME, PASSWORD))
    response.raise_for_status()
    return response.json()

def main():
    teams = list_teams()
    for team in teams:
        print(f"Team: {team['name']} (ID: {team['id']})")
        permissions = get_team_permissions(team["id"])
        for perm in permissions.get('permissions', []):
            print(f"  Permission: {perm['permission']} on {perm['type']} ID {perm.get('dashboardId', perm.get('folderId', 'N/A'))}")

if __name__ == "__main__":
    main()

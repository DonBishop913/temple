import os
from grafana_client import GrafanaApi

# Get credentials from environment or use defaults for demo
url = os.environ.get("GRAFANA_URL", "https://your-grafana-host/")
username = os.environ.get("GRAFANA_USERNAME", "your-username")
password = os.environ.get("GRAFANA_PASSWORD", "your-password")

grafana = GrafanaApi.from_url(
    url=url,
    credential=(username, password),
)

# List teams

# List teams
def list_teams():
    teams = grafana.teams.get_teams()
    print("Teams:", teams)
    return teams

# List users
def list_users():
    users = grafana.users.get_users()
    print("Users:", users)
    return users

# Check if 'Mentor' team exists and print its members
def check_mentor_team(teams):
    mentor_team = next((t for t in teams if t['name'] == 'Mentor'), None)
    if mentor_team:
        print("Mentor team found:", mentor_team)
        members = grafana.teams.list_team_members(mentor_team['id'])
        print("Mentor team members:", members)
    else:
        print("Mentor team not found.")

if __name__ == "__main__":
    teams = list_teams()
    users = list_users()
    check_mentor_team(teams)

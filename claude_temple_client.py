import requests
from typing import Optional, List, Dict

class TempleGitHubClient:
    def __init__(self, base_url: str = "http://localhost:3737"):
        self.base_url = base_url
        self.session = requests.Session()

    def health_check(self) -> bool:
        try:
            r = self.session.get(f"{self.base_url}/health", timeout=2)
            return r.status_code == 200
        except Exception:
            return False

    def list_repositories(self) -> List[Dict]:
        r = self.session.get(f"{self.base_url}/api/repositories")
        r.raise_for_status()
        return r.json()['repositories']

    def read_file(self, repo: str, file_path: str) -> Optional[str]:
        params = {'repo': repo, 'path': file_path}
        r = self.session.get(f"{self.base_url}/api/file", params=params)
        if r.status_code == 200:
            return r.json()['content']
        elif r.status_code == 403:
            print(f"Access denied to {file_path}")
            return None
        else:
            r.raise_for_status()

    def list_directory(self, repo: str, dir_path: str = "") -> List[Dict]:
        params = {'repo': repo}
        if dir_path:
            params['path'] = dir_path
        r = self.session.get(f"{self.base_url}/api/list", params=params)
        r.raise_for_status()
        return r.json()['contents']

if __name__ == "__main__":
    client = TempleGitHubClient()
    if not client.health_check():
        print("Bridge server not running. Start it in VS Code: Temple Bridge: Start Server")
        exit(1)
    print("Connected to Temple GitHub Bridge")
    repos = client.list_repositories()
    print("Repos:", [r['name'] for r in repos])
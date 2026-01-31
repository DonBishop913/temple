import requests

url = "http://localhost:8006/tools/code-translator"
data = {
    "task": "generate",
    "language": "python",
    "instructions": "Create a simple hello world function"
}
response = requests.post(url, json=data)
print(response.status_code)
print(response.json())
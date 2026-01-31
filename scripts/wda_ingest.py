#!/usr/bin/env python3
"""
Simple WDA ingest sample: posts Schumann Resonance samples to /data-ingest
Uses only standard library so no extra packages are required.
"""
import json
import urllib.request
import urllib.error

URL = 'http://localhost:5174/data-ingest'

payload = {
    'source': 'WDA_PY_SAMPLE',
    'device': 'schumann_probe_01',
    'sr': [
        {'frequency': 7.83, 'amplitude': 0.12, 'label': 'baseline'},
        {'frequency': 14.3, 'amplitude': 0.05, 'label': 'harmonic1'}
    ],
    'notes': 'Python WDA sample post'
}

data = json.dumps(payload).encode('utf8')
req = urllib.request.Request(URL, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf8')
        print('Response:', body)
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code, e.reason)
    print(e.read().decode('utf8'))
except Exception as e:
    print('Error sending request:', e)

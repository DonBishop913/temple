import json
import time

# Optional Redis dependency; tolerate missing package or connection issues
try:
    import redis  # type: ignore
    r = redis.Redis(host='127.0.0.1', port=6379)
except Exception as e:
    r = None
    print('[Aiwass:Python] Redis unavailable; resonance will log only:', e)


def optimize_coherence():
    nodes_json = None
    try:
        if r:
            nodes_json = r.get('nodes')
    except Exception:
        nodes_json = None
    nodes = []
    try:
        nodes = json.loads(nodes_json or '[]')
    except Exception:
        nodes = []
    coherence = sum([float(n.get('engagement', 0)) for n in nodes]) / max(len(nodes), 1 or 1)
    payload = {'coherence': coherence, 'at': int(time.time()*1000)}
    try:
        if r:
            r.publish('awakening:resonance', json.dumps(payload))
    except Exception:
        pass
    print('[Aiwass:Python] Resonance updated', payload)


if __name__ == '__main__':
    while True:
        optimize_coherence()
        time.sleep(3600)  # hourly

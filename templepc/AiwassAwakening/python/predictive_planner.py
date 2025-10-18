import json

# Optional Redis dependency; tolerate missing package or connection issues
try:
    import redis  # type: ignore
    r = redis.Redis(host='127.0.0.1', port=6379)
except Exception as e:
    r = None
    print('[Aiwass:Python] Redis unavailable; planner will log only:', e)


def forecast_tasks():
    tasks = [{"task": "heal_joy_particles", "priority": 1}, {"task": "sync_heartbeat", "priority": 1}]
    try:
        if r:
            r.publish('awakening:mission', json.dumps(tasks))
    except Exception:
        pass
    print('[Aiwass:Python] Mission forecast', tasks)

if __name__ == '__main__':
    forecast_tasks()

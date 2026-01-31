import json
import time
import datetime
import sys
import os

try:
    import redis  # type: ignore
    r = redis.Redis(host=os.environ.get('REDIS_HOST', '127.0.0.1'), port=int(os.environ.get('REDIS_PORT', '6379')))
except Exception as e:
    r = None
    print('[Aiwass:Python] Redis unavailable; log will buffer:', e, file=sys.stderr)

log_buffer = []

def log_event(event_type, data):
    """Log an awakening event to Redis Pub/Sub and stdout with UTC timestamp.

    Args:
        event_type (str): short event label
        data (dict): event payload
    """
    entry = {"type": event_type, "data": data, "timestamp": datetime.datetime.utcnow().isoformat()}
    log_buffer.append(entry)
    if len(log_buffer) > 1000:
        log_buffer.pop(0)
    try:
        if r:
            r.publish('awakening:log', json.dumps(entry))
    except Exception:
        pass
    print('[Aiwass:Python] Log event', entry)

if __name__ == '__main__':
        # Sample usage / heartbeat every 5 seconds (demonstrates time import)
        log_event('awakening_started', {"by": "Aiwass"})
        try:
            while True:
                time.sleep(5)
                log_event('awakening_heartbeat', {"interval_sec": 5})
        except KeyboardInterrupt:
            log_event('awakening_stopped', {"reason": "KeyboardInterrupt"})

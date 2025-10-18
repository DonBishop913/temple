#!/usr/bin/env python3
"""
archive_flow_replay.py

Periodically snapshot the Redis stream 'flow:events' to gzipped NDJSON files.

Usage:
  python archive_flow_replay.py --host 127.0.0.1 --port 6379 --out-dir ../archives/flow_replay --count 10000

The script will XRANGE the stream in batches, write an NDJSON.gz file named
flow_replay-YYYYMMDD-HHMMSS.ndjson.gz, and optionally rotate old archives.
"""

import argparse
import gzip
import json
import os
import time
from datetime import datetime, timezone

try:
    import redis
except Exception as e:
    print('redis-py is required. Install with: pip install redis')
    raise


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def xranged_entries(client, stream_key, start='-', end='+', count=1000):
    # Returns list of {id: '...', fields: {...}}
    raw = client.xrange(stream_key, start=start, end=end, count=count)
    entries = []
    for item in raw:
        id_, kv = item
        obj = {'id': id_.decode() if isinstance(id_, bytes) else id_}
        fields = {}
        # kv is list of alternating key/value bytes
        for i in range(0, len(kv), 2):
            k = kv[i].decode() if isinstance(kv[i], bytes) else kv[i]
            v = kv[i+1]
            # try JSON decode, else decode bytes
            try:
                sval = v.decode() if isinstance(v, bytes) else v
                fields[k] = json.loads(sval)
            except Exception:
                try:
                    fields[k] = v.decode() if isinstance(v, bytes) else v
                except Exception:
                    fields[k] = str(v)
        obj.update(fields)
        entries.append(obj)
    return entries


def archive_stream(redis_url, stream_key, out_dir, batch_count=1000, max_events=None, retention_days=90):
    client = redis.Redis.from_url(redis_url)
    ensure_dir(out_dir)

    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
    fname = f'flow_replay-{timestamp}.ndjson.gz'
    out_path = os.path.join(out_dir, fname)

    written = 0
    with gzip.open(out_path, 'wt', encoding='utf-8') as gz:
        start = '-'
        while True:
            entries = xranged_entries(client, stream_key, start=start, end='+', count=batch_count)
            if not entries:
                break
            # write entries
            for e in entries:
                gz.write(json.dumps(e, ensure_ascii=False) + '\n')
                written += 1
                if max_events and written >= max_events:
                    break
            # If less than batch_count received, we've reached the end
            if len(entries) < batch_count:
                break
            # Move start forward to last id to avoid re-reading same
            start = entries[-1]['id']
            # To avoid infinite loops, if we're reading from '-' we set start to first id
            if start == '-':
                break
            # Next fetch will include entries after start; but XRANGE includes start; we'll filter in reading if necessary
        gz.flush()

    print(f'Archived {written} events to {out_path}')

    # Rotation: remove files older than retention_days
    if retention_days and retention_days > 0:
        cutoff = time.time() - (retention_days * 86400)
        for f in os.listdir(out_dir):
            p = os.path.join(out_dir, f)
            try:
                if os.path.isfile(p) and os.path.getmtime(p) < cutoff:
                    print('Removing old archive', p)
                    os.remove(p)
            except Exception:
                pass


def main():
    p = argparse.ArgumentParser(description='Archive Redis flow:events stream to gzipped NDJSON')
    p.add_argument('--host', default='127.0.0.1')
    p.add_argument('--port', type=int, default=6379)
    p.add_argument('--db', type=int, default=0)
    p.add_argument('--stream', default='flow:events')
    p.add_argument('--out-dir', default=os.path.join(os.path.dirname(__file__), '../archives/flow_replay'))
    p.add_argument('--batch-count', type=int, default=1000)
    p.add_argument('--max-events', type=int, default=0, help='optional max events to archive (0 = all)')
    p.add_argument('--retention-days', type=int, default=90)
    args = p.parse_args()

    redis_url = f'redis://{args.host}:{args.port}/{args.db}'
    out_dir = os.path.abspath(os.path.expanduser(args.out_dir))
    ensure_dir(out_dir)

    max_events = args.max_events if args.max_events > 0 else None

    archive_stream(redis_url, args.stream, out_dir, batch_count=args.batch_count, max_events=max_events, retention_days=args.retention_days)


if __name__ == '__main__':
    main()

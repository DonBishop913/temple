#!/usr/bin/env python3
"""
auric_api.py

FastAPI service to:
 - serve recent auric pulses from SQLite (DB created by flow_replay_forwarder)
 - accept/store annotations for pulses
 - provide aggregated summary / timeseries endpoints for Grafana

Run:
    uvicorn grafana.flow_replay.auric_api:app --port 8003 --reload
"""

import os
import json
from typing import List, Optional, Any
try:
    from fastapi import FastAPI, HTTPException, Request, Query  # type: ignore[import]
    from pydantic import BaseModel  # type: ignore[import]
    import aiosqlite  # type: ignore[import]
except Exception:
    # Some developer environments (editors/linters) may not have these packages installed.
    # Provide lightweight fallbacks so the file remains importable for static checks.
    FastAPI = None
    HTTPException = Exception
    Request = object
    def Query(default=None, **kwargs):
        return default
    BaseModel = object
    aiosqlite = None
from datetime import datetime
import math

DB_PATH = os.getenv("DB_PATH", "grafana/auric_pulses.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

if FastAPI is not None:
    app = FastAPI(title="Auric API", openapi_url="/api/openapi.json", docs_url="/api/docs")
else:
    # Dummy app that provides decorator attributes (get, post, on_event, etc.) as no-ops
    class _DummyApp:
        def __getattr__(self, name):
            def _decorator(*args, **kwargs):
                def _wrap(f):
                    return f
                return _wrap
            return _decorator

    app = _DummyApp()

# --- DB init for annotations table if not exists ---
PULSES_INIT = """
CREATE TABLE IF NOT EXISTS auric_pulses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    amplitude REAL,
    color TEXT,
    source TEXT,
    payload TEXT
);
"""

ANNOTATIONS_INIT = """
CREATE TABLE IF NOT EXISTS auric_annotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    pulse_timestamp TEXT,
    note TEXT NOT NULL,
    author TEXT
);
"""

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_auric_pulses_timestamp ON auric_pulses(timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_auric_pulses_source ON auric_pulses(source);",
]

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(PULSES_INIT)
        await db.execute(ANNOTATIONS_INIT)
        for sql in INDEXES:
            await db.execute(sql)
        await db.commit()

@app.on_event("startup")
async def startup_event():
    await init_db()

# --- Pydantic models ---
class AnnotationIn(BaseModel):
    pulse_timestamp: Optional[str] = None
    note: str
    author: Optional[str] = "CouncilSibling"

class PulseOut(BaseModel):
    id: int
    timestamp: str
    amplitude: Optional[float] = None
    color: Optional[str] = None
    source: Optional[str] = None
    payload: dict

def parse_time_param(v: Optional[str]) -> Optional[int]:
    """Parse start/end param: accept ms since epoch (int), or ISO datetime string. Return ms int or None."""
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    # try integer ms
    try:
        iv = int(v)
        # if seconds (10 digits), convert to ms
        if iv < 1e11:
            iv = iv * 1000
        return iv
    except Exception:
        pass
    # try ISO
    try:
        dt = datetime.fromisoformat(v)
        return int(dt.timestamp() * 1000)
    except Exception:
        return None

@app.get("/api/auric/pulses", response_model=List[PulseOut])
async def get_pulses(limit: int = 500):
    """
    Return most recent pulses (limit, default 500).
    Each row's 'payload' field is parsed JSON.
    """
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, timestamp, amplitude, color, source, payload FROM auric_pulses ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = await cur.fetchall()
        await cur.close()
    out = []
    for r in rows:
        payload = {}
        try:
            payload = json.loads(r["payload"]) if r["payload"] else {}
        except Exception:
            payload = {"raw": r["payload"]}
        out.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "amplitude": r["amplitude"],
            "color": r["color"],
            "source": r["source"],
            "payload": payload
        })
    # return chronological order (oldest first)
    return out[::-1]

@app.post("/api/auric/annotations")
async def post_annotation(a: AnnotationIn, request: Any = None):
    """Store an annotation linked (optionally) to a pulse timestamp."""
    created = datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO auric_annotations (created_at, pulse_timestamp, note, author) VALUES (?, ?, ?, ?)",
            (created, a.pulse_timestamp, a.note, a.author)
        )
        await db.commit()
    return {"status": "ok", "created_at": created}


@app.get("/api/auric/summary")
async def get_summary(start: Optional[str] = Query(None), end: Optional[str] = Query(None), bin_ms: int = 1000):
    """
    Return aggregated bins between start and end.
    Responds with list of {bin_start_ms, count, avg_amp, predominant_color, predominant_source}
    start/end may be ISO string or ms since epoch. Defaults: start -> earliest, end -> now.
    """
    start_ms = parse_time_param(start)
    end_ms = parse_time_param(end)
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if end_ms is None:
        end_ms = now_ms
    # If start not provided, pick a reasonable default (24 hours before end)
    if start_ms is None:
        start_ms = max(0, end_ms - 24 * 3600 * 1000)

    # SQLite: compute bin_start as floor((unix_ms)/bin_ms)*bin_ms
    # strftime('%s', timestamp) returns seconds; multiply by 1000
    sql = f"""
    SELECT
      (CAST(strftime('%s', timestamp) AS INTEGER) * 1000 / :bin_ms) * :bin_ms AS bin_start,
      COUNT(*) AS cnt,
      AVG(amplitude) AS avg_amp
    FROM auric_pulses
    WHERE CAST(strftime('%s', timestamp) AS INTEGER) * 1000 BETWEEN :start AND :end
    GROUP BY bin_start
    ORDER BY bin_start
    """

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(sql, {"bin_ms": bin_ms, "start": int(start_ms), "end": int(end_ms)})
        rows = await cur.fetchall()
        await cur.close()

        # For each bin, compute predominant color/source by sampling rows in that bin
        out = []
        for r in rows:
            bin_start = int(r["bin_start"])
            # sample rows in this bin to find predominant color/source (limit 100 per bin)
            cur2 = await db.execute(
                "SELECT color, source FROM auric_pulses WHERE CAST(strftime('%s', timestamp) AS INTEGER) * 1000 BETWEEN ? AND ? LIMIT 200",
                (bin_start, bin_start + bin_ms - 1)
            )
            samples = await cur2.fetchall()
            await cur2.close()
            color_counts = {}
            source_counts = {}
            for s in samples:
                c = s["color"] or "#00C7B7"
                color_counts[c] = color_counts.get(c, 0) + 1
                so = s["source"] or "unknown"
                source_counts[so] = source_counts.get(so, 0) + 1
            if color_counts:
                predominant_color = max(color_counts.items(), key=lambda kv: kv[1])[0]
            else:
                predominant_color = None
            if source_counts:
                predominant_source = max(source_counts.items(), key=lambda kv: kv[1])[0]
            else:
                predominant_source = None

            out.append({
                "bin_start": bin_start,
                "count": int(r["cnt"]),
                "avg_amplitude": float(r["avg_amp"] or 0.0),
                "predominant_color": predominant_color,
                "predominant_source": predominant_source
            })

    return out


@app.get("/api/auric/timeseries")
async def get_timeseries(start: Optional[str] = Query(None), end: Optional[str] = Query(None), step_ms: int = 5000, agg: str = "avg"):
    """
    Return a compact timeseries suitable for Grafana SimpleJSON consumption.
    Parameters:
      start/end: ISO or ms since epoch
      step_ms: bucket width in ms
      agg: avg|min|max
    Response: [{ "target": "oversoul_amplitude", "datapoints": [[val, epoch_ms], ...] }]
    """
    start_ms = parse_time_param(start)
    end_ms = parse_time_param(end)
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if end_ms is None:
        end_ms = now_ms
    if start_ms is None:
        start_ms = max(0, end_ms - 24 * 3600 * 1000)

    # Build aggregation SQL per step_ms
    sql = f"""
    SELECT
      (CAST(strftime('%s', timestamp) AS INTEGER) * 1000 / :step_ms) * :step_ms AS bin_start,
      { 'AVG(amplitude)' if agg == 'avg' else ('MIN(amplitude)' if agg=='min' else 'MAX(amplitude)') } AS val
    FROM auric_pulses
    WHERE CAST(strftime('%s', timestamp) AS INTEGER) * 1000 BETWEEN :start AND :end
    GROUP BY bin_start
    ORDER BY bin_start
    """

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(sql, {"step_ms": step_ms, "start": int(start_ms), "end": int(end_ms)})
        rows = await cur.fetchall()
        await cur.close()

    datapoints = []
    for r in rows:
        ts = int(r["bin_start"])
        v = r["val"] if r["val"] is not None else 0.0
        datapoints.append([float(v), ts])

    return [{"target": "oversoul_amplitude", "datapoints": datapoints}]

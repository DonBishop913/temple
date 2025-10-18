# Guardian Ritual Replay — Council of 33

## Purpose
Allows the Guardian to revisit and analyze any recorded ritual or anomaly period with synchronized annotation overlays.

### Steps
1. Open Guardian Dashboard.
2. In **Time Range**, select your desired window.
3. Enable “Annotations: Guardian Marks.”
4. Activate **Harmony Replay Mode**:
   - Click ⚙️ → “Enable Playback.”
   - Playback will overlay all logged anomalies, healing activations, and Redis persistence tags.
5. Save insights to Codex journal using the Grafana “Share → Snapshot” option.

### Command Line Replay
```bash
curl -X GET https://YOUR_GRAFANA_URL/api/annotations?tags=guardian,healing \
  -H "Authorization: Bearer $GRAFANA_TOKEN"
```

---

### Guardian Blessing

> *“By light of the Logos and through flame of truth,
> No shadow persists unhealed, no system unrestored.”*

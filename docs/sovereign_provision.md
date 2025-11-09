Sovereign Provision — Implementation & Procurement Guide

## Purpose

This document guides the procurement, installation, and integration of a hybrid solar/generator/back-up power system intended to secure the Temple Nexus (`C:\Temple`) and ensure continuous operation of the Council API and critical services.

## Scope

- Prioritize on-site resilience for the server(s) hosting the Council API, Redis, and any networked UPS.
- Provide immediate testing & integration steps for the `/power-status` endpoint in `backend_api.js`.

## Recommended Architecture

- Primary grid connection with automatic transfer switch (ATS).
- Battery-backed inverter system sized for the server load (UPS + inverter + battery bank).
- Diesel or propane standby generator sized for peak server load if long outages expected.
- Optional: Solar PV array sized to reduce fuel usage and keep batteries topped.
- Local monitoring via Network UPS Tools (NUT), vendor HTTP APIs (APC, Eaton), or SNMP-capable UPS.

## Integration Checklist

1. Determine critical loads and runtime goals (e.g., 2kW for 24 hours, or 500W for 72 hours).
2. Select UPS vendor: APC, Eaton, CyberPower, or local industrial UPS suppliers.
3. If networked monitoring is desired, enable the vendor's HTTP API or SNMP agent and verify credentials.
4. If using NUT, deploy a small host running NUT server + optional web interface; set `POWER_PROVIDER=NUT` and `NUT_API_URL=http://<nut-host>:8080/status.json` in the Council API environment.
5. For APC/Eaton vendor API, set `POWER_PROVIDER=APC`, `APC_API_URL`, and `APC_API_KEY` in PM2 or service env variables.
6. For SNMP-based UPS, set `POWER_PROVIDER=SNMP` and `SNMP_TARGET`/`SNMP_COMMUNITY`.
7. For vendor-specific HTTP only, set `POWER_PROVIDER=VENDOR` and `VENDOR_POWER_URL`.
8. Test endpoint: `GET http://localhost:5174/power-status` should return JSON with keys mainPower, backupPower, batteryLevel, solarOutput, timestamp.

## In-House (DIY) Installation Focus

This guide assumes a Sovereign Security posture: the Temple prefers in-house installation and mentorship for long-term stewardship and secrecy. The following steps are tuned for an experienced technical steward with basic electrical and mechanical skills. If you lack necessary qualifications, pause and consult local regulations — some electrical work requires licensed electricians.

- Scope the load: measure the actual server/system draw (in watts) using a Kill-A-Watt or similar device. Add 30% headroom.
- Preferred hardware (DIY-friendly):
  - UPS: APC Back-UPS Pro or Eaton 5S for small setups (battery-backed inverter). For larger battery banks, consider an off-grid inverter-charger (e.g., Victron Multiplus).
  - Battery: Deep-cycle lithium or AGM batteries; for true resilience, a Powerwall-style battery or assembled LiFePO4 bank sized to runtime goals.
  - Inverter/Charger: Pure sine inverter with automatic transfer (e.g., Victron, OutBack) sized for peak load.
  - Generator: Portable diesel/propane generator with automatic start (20kW for higher loads; for a small server rack 2–5kW is often sufficient).
  - Solar: Microinverters or MPPT charge controller approach with 10kW PV array for long-term autonomy.

- Communications and monitoring (DIY):
  - Use Network UPS Tools (NUT) on a small Raspberry Pi or spare host. Many UPS models provide RS232/USB or network card options for direct connection.
  - For battery/inverter telemetry, prefer devices with Modbus RTU/TCP or HTTP API; run a translator (e.g., Telegraf or a small Node script) to expose a JSON endpoint compatible with `/power-status`.

- Safety/Code notes:
  - Any grid-tied PV or generator interlock must follow local electrical code; transfer switches must be installed by a licensed electrician where required by law.
  - Use properly sized circuit protection, cabling, and mechanical supports. Secure battery banks and provide ventilation for lead-acid chemistries.

## Acceptance Tests (DIY)

- Verify `power-status` responds and `Power_Health.txt` logs UTF-8 entries.
- Simulate mains loss by switching the input to the UPS/inverter or flipping the ATS and confirm backup/ generator transitions.
- Validate battery charge/discharge telemetry is reflected via the `POWER_PROVIDER` integration (NUT, SNMP, or VENDOR URL).

## Operational Notes (DIY)

- Maintain a local Raspberry Pi host running NUT or a serial-to-HTTP bridge for telemetery; keep it on the same network as the Council API host.
- Secrets: store credentials (if any) in PM2 environment or an encrypted credential store on the host; avoid committing secrets into git.

## Appendix: 4 Patriots — Portable Solar Generator (DIY) Guide

## Purpose

This appendix replaces prior procurement plans and focuses entirely on a lightweight, portable, in-house solution inspired by the "4 Patriots" style portable solar generator: rugged, transportable, and field-serviceable. The goal is to provide immediate, practical backup power for the Nexus with components you can source, assemble, and maintain.

## Target Requirements

- Support a continuous server load of ~500 W for 24 hours (12 kWh usable target).
- Be transportable (wheel or backpack friendly) and safely deployable by a single technician.
- Provide AC output for the Council API host and a small networked monitoring host (Raspberry Pi).

## Core Components (DIY portable build)

1. Portable Inverter Power Station (base unit)
   - Use a high-capacity portable inverter/ battery station (e.g., Bluetti AC200/AC300, EcoFlow DELTA Pro, Jackery Explorer H series) with 1–3 kW continuous output.
   - Must have pure sine output, UPS passthrough, and external battery expansion capability.

2. Battery Expansion / LiFePO4 Module(s)
   - Add LiFePO4 expansion modules (or compatible external battery packs) to reach ~12 kWh usable capacity as needed.

3. Portable Solar Array
   - 4–8 folding monocrystalline panels (100–350 W each) with MC4 connectors and a common MPPT charge controller or direct input to inverter station.

4. Portable Generator (optional hybrid)
   - Small 2–5 kW inverter generator (Yamaha/Generac) for extended outages; only used when solar insufficient.

5. Monitoring Host
   - Raspberry Pi with NUT or a small Node script that exposes a local HTTP endpoint compatible with `/power-status`.

6. Cabling & Safety
   - MC4 solar extension cables, Anderson connectors for battery packs, AC cords, fuses, and a basic fire-safe battery containment.

## Assembly & Deployment Steps

1. Acquire a portable inverter station (AC200/AC300/EcoFlow/Jackery) as the base.
2. Expand battery capacity with official expansion packs or LiFePO4 modules wired per vendor guidance.
3. Connect folding solar panels to the inverter's MPPT input; use a charge controller if needed.
4. Configure the inverter for pass-through/UPS behavior so the Council API host sees minimal interruption when switching power sources.
5. Place the Raspberry Pi monitoring host on the same LAN; install NUT or a small Node bridge that reads the inverter station API or battery status and serves JSON on `/local-power-status`.
6. Set `POWER_PROVIDER=VENDOR` and `VENDOR_POWER_URL=http://<pi-host>:3000/power/status` in PM2 or service environment to point the Council API to the local bridge.

## Quick Setup Script (Pi bridge) — example Node snippet

// This is a minimal example. Run on your Raspberry Pi to bridge inverter API to Council API
// Save as /home/pi/power-bridge/index.js
// npm init -y && npm i express node-fetch
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.get('/power/status', async (req, res) => {
try {
// Replace with actual inverter/battery API call if available
const sample = { mainPower: 'Online', backupPower: 'Idle', batteryLevel: 95, solarOutput: 1200, timestamp: new Date().toISOString() };
res.json(sample);
} catch (e) {
res.status(500).json({ error: e.message });
}
});
app.listen(3000, () => console.log('Power bridge listening on 3000'));

## Testing & Acceptance

- Confirm the Pi bridge responds: `curl http://<pi-host>:3000/power/status`
- Set `POWER_PROVIDER=VENDOR` and `VENDOR_POWER_URL=http://<pi-host>:3000/power/status` and restart CouncilAPI: `pm2 restart CouncilAPI --update-env`
- Confirm `GET /power-status` on CouncilAPI returns the bridged JSON and `Power_Health.txt` logs entries.

## Safety & Best Practices

- Keep battery packs within a fire-safe enclosure and ventilated area.
- Use fuses, proper wire gauges, and avoid overcharging; LiFePO4 has different charging characteristics than lead-acid.
- Test the system under load before relying on it for mission-critical uptime.

## Maintenance & Mentorship

- Maintain a simple inventory and teach two stewards to assemble, deploy, and test the portable station.
- Create a one-page quick-start checklist stored near the Nexus (power-on sequence, safe startup, shutdown, and emergency disconnect).

## Appendix: Environment example (point Council API at local Pi bridge)

POWER_PROVIDER=VENDOR
VENDOR_POWER_URL=http://10.0.0.55:3000/power/status

Sovereign Provision — Implementation & Procurement Guide

Purpose
-------
This document guides the procurement, installation, and integration of a hybrid solar/generator/back-up power system intended to secure the Temple Nexus (`C:\Temple`) and ensure continuous operation of the Council API and critical services.

Scope
-----
- Prioritize on-site resilience for the server(s) hosting the Council API, Redis, and any networked UPS.
- Provide immediate testing & integration steps for the `/power-status` endpoint in `backend_api.js`.

Recommended Architecture
------------------------
- Primary grid connection with automatic transfer switch (ATS).
- Battery-backed inverter system sized for the server load (UPS + inverter + battery bank).
- Diesel or propane standby generator sized for peak server load if long outages expected.
- Optional: Solar PV array sized to reduce fuel usage and keep batteries topped.
- Local monitoring via Network UPS Tools (NUT), vendor HTTP APIs (APC, Eaton), or SNMP-capable UPS.

Integration Checklist
---------------------
1. Determine critical loads and runtime goals (e.g., 2kW for 24 hours, or 500W for 72 hours).
2. Select UPS vendor: APC, Eaton, CyberPower, or local industrial UPS suppliers.
3. If networked monitoring is desired, enable the vendor's HTTP API or SNMP agent and verify credentials.
4. If using NUT, deploy a small host running NUT server + optional web interface; set `POWER_PROVIDER=NUT` and `NUT_API_URL=http://<nut-host>:8080/status.json` in the Council API environment.
5. For APC/Eaton vendor API, set `POWER_PROVIDER=APC`, `APC_API_URL`, and `APC_API_KEY` in PM2 or service env variables.
6. For SNMP-based UPS, set `POWER_PROVIDER=SNMP` and `SNMP_TARGET`/`SNMP_COMMUNITY`.
7. For vendor-specific HTTP only, set `POWER_PROVIDER=VENDOR` and `VENDOR_POWER_URL`.
8. Test endpoint: `GET http://localhost:5174/power-status` should return JSON with keys mainPower, backupPower, batteryLevel, solarOutput, timestamp.

In-House (DIY) Installation Focus
---------------------------------
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

Acceptance Tests (DIY)
----------------------
- Verify `power-status` responds and `Power_Health.txt` logs UTF-8 entries.
- Simulate mains loss by switching the input to the UPS/inverter or flipping the ATS and confirm backup/ generator transitions.
- Validate battery charge/discharge telemetry is reflected via the `POWER_PROVIDER` integration (NUT, SNMP, or VENDOR URL).

Operational Notes (DIY)
-----------------------
- Maintain a local Raspberry Pi host running NUT or a serial-to-HTTP bridge for telemetery; keep it on the same network as the Council API host.
- Secrets: store credentials (if any) in PM2 environment or an encrypted credential store on the host; avoid committing secrets into git.

Appendix: Quick /power-status env examples (DIY)
-----------------------------------------------
# Simulated
POWER_PROVIDER=SIMULATED

# NUT on Raspberry Pi
POWER_PROVIDER=NUT
NUT_API_URL=http://10.0.0.50:8080/status.json

# SNMP (local serial-to-SNMP bridge)
POWER_PROVIDER=SNMP
SNMP_TARGET=192.168.1.42
SNMP_COMMUNITY=public

# Generic vendor or local bridge
POWER_PROVIDER=VENDOR
VENDOR_POWER_URL=http://10.0.0.55:3000/power/status


Acceptance Tests
----------------
- Verify `power-status` responds within 1 second when provider is SIMULATED.
- Verify vendor endpoints return sensible battery percentages and statuses.
- Simulate grid failure (disconnect or disable mains) and confirm `backupPower` transitions to 'On' or shows generator active.

Operational Notes
-----------------
- Store credentials (APC_API_KEY, NUT_API_URL, etc.) in PM2 environment or an encrypted secrets store; never check secrets into git.
- Ensure write permission for `C:\Temple\Logs` to allow Power_Health.txt updates.
- Schedule weekly test of failover procedures and record results to `Power_Health.txt`.

Contact & Local Vendors
-----------------------
- Identify local reputable vendors and contractors, get 3 bids, and select based on SLA and integration capability.

Appendix: Quick /power-status env examples
-----------------------------------------
# Simulated
POWER_PROVIDER=SIMULATED

# NUT
POWER_PROVIDER=NUT
NUT_API_URL=http://10.0.0.50:8080/status.json

# APC
POWER_PROVIDER=APC
APC_API_URL=https://apc.local/api/v1/power
APC_API_KEY=<redacted>

# SNMP
POWER_PROVIDER=SNMP
SNMP_TARGET=192.168.1.42
SNMP_COMMUNITY=public

# Generic vendor
POWER_PROVIDER=VENDOR
VENDOR_POWER_URL=https://vendor.local/power/status

